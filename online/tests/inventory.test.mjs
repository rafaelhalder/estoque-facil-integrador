import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { Inventory, integer } from '../work/inventory-test.mjs';

class Statement {
  constructor(db,sql,args=[]) {this.db=db;this.sql=sql;this.args=args;}
  bind(...args) {return new Statement(this.db,this.sql,args);}
  async first() {return this.db.prepare(this.sql).get(...this.args) ?? null;}
  async all() {return {results:this.db.prepare(this.sql).all(...this.args)};}
}
function fixture() {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()) sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
  const db={prepare:sql=>new Statement(sqlite,sql),async batch(statements) {
    sqlite.exec('BEGIN');
    try {const result=[];for(const s of statements) result.push(await s.all());sqlite.exec('COMMIT');return result;}
    catch(e) {sqlite.exec('ROLLBACK');throw e;}
  }};
  return {sqlite,db,a:new Inventory(db,'participant-a'),b:new Inventory(db,'participant-b')};
}
const product=(extra={})=>({sku:'TESTE-01',name:'Produto de teste',category:'Teste',unit:'un',price:'12,30',min_stock:'2',initial_stock:'5',...extra});
const errorStatus=status=>error=>error.status===status;

test('semente fica idempotente e o resumo confere',async()=>{
  const {a}=fixture();await a.seed();await a.seed();const s=await a.snapshot();
  assert.deepEqual(s.summary,{products:6,units:90,low_stock:3,value_cents:114500});assert.equal(s.movements.length,5);
});
test('cada participante recebe registros separados',async()=>{
  const {a,b}=fixture();await a.seed();await b.seed();const p=await a.create(product());
  assert.equal((await a.snapshot()).products.length,7);assert.equal((await b.snapshot()).products.length,6);
  await assert.rejects(b.move({product_id:p.id,kind:'saida',quantity:1}),errorStatus(404));
  await assert.rejects(b.update(p.id,{...product(),version:p.version}),errorStatus(404));
  await assert.rejects(b.archive(p.id,{version:p.version}),errorStatus(404));
});
test('cadastro registra saldo inicial no histórico',async()=>{
  const {a}=fixture();const p=await a.create(product());const s=await a.snapshot();
  assert.equal(p.stock,5);assert.equal(p.price_cents,1230);assert.equal(s.movements[0].balance_after,5);
});
test('saída acima do saldo não altera saldo nem histórico',async()=>{
  const {a}=fixture();const p=await a.create(product());
  await assert.rejects(a.move({product_id:p.id,kind:'saida',quantity:'6'}),errorStatus(409));
  const s=await a.snapshot();assert.equal(s.products[0].stock,5);assert.equal(s.movements.length,1);
});
test('entrada e saída mantêm saldo e trilha de auditoria',async()=>{
  const {a}=fixture();const p=await a.create(product());await a.move({product_id:p.id,kind:'entrada',quantity:3});
  await a.move({product_id:p.id,kind:'saida',quantity:2});const s=await a.snapshot();
  assert.equal(s.products[0].stock,6);assert.deepEqual(s.movements.map(m=>m.balance_after),[6,8,5]);
});
test('duas saídas concorrentes nunca deixam saldo negativo',async()=>{
  const {a}=fixture();const p=await a.create(product());
  const results=await Promise.allSettled([a.move({product_id:p.id,kind:'saida',quantity:4}),a.move({product_id:p.id,kind:'saida',quantity:4})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await a.snapshot()).products[0].stock,1);
});
test('edição rejeita versão desatualizada',async()=>{
  const {a}=fixture();const p=await a.create(product());await a.update(p.id,{...product({name:'Novo nome'}),version:p.version});
  await assert.rejects(a.update(p.id,{...product(),version:p.version}),errorStatus(409));
});
test('arquivamento exige saldo zero e preserva histórico e código',async()=>{
  const {a}=fixture();const p=await a.create(product());await assert.rejects(a.archive(p.id,{version:p.version}),errorStatus(409));
  await a.move({product_id:p.id,kind:'saida',quantity:5});const current=(await a.snapshot()).products[0];
  await a.archive(p.id,{version:current.version});const s=await a.snapshot();assert.equal(s.products.length,0);assert.equal(s.movements.length,2);
  await assert.rejects(a.create(product()),errorStatus(409));
});
test('validação impede inteiros inválidos e preços com três casas',async()=>{
  const {a}=fixture();for(const value of [true,1.5,'-1','1e2',null]) assert.throws(()=>integer(value,'Quantidade'));
  for(const price of ['1,234','-1','NaN','1000001','1e6']) await assert.rejects(a.create(product({price})),errorStatus(400));
});
test('limite de saldo não é ultrapassado',async()=>{
  const {a}=fixture();const p=await a.create(product({initial_stock:1000000}));
  await assert.rejects(a.move({product_id:p.id,kind:'entrada',quantity:1}),errorStatus(409));
  assert.equal((await a.snapshot()).products[0].stock,1000000);
});
test('gatilho rejeita saldo auditado inconsistente',async()=>{
  const {a,sqlite}=fixture();const p=await a.create(product());
  assert.throws(()=>sqlite.prepare("INSERT INTO movements(token,product_id,kind,quantity,note,balance_after) VALUES('inv',?,'saida',2,'',99)").run(p.id));
  assert.equal((await a.snapshot()).products[0].stock,5);
});
