import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { AppError, Inventory, integer } from '../../../lib/inventory';

export const dynamic = 'force-dynamic';
const reply = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function handle(request:Request) {
  try {
    const user = await getChatGPTUser();
    if(!user) throw new AppError('Entre com sua conta do ChatGPT para testar o sistema.',401);
    if(!env.DB) throw new Error('DB binding unavailable');
    const write = request.method!=='GET';
    if(write) {
      const origin = request.headers.get('origin');
      const allowed = [new URL(request.url).origin,'https://estoque-facil-rafael-testes.wryriver35.chatgpt.site'];
      if((origin && !allowed.includes(origin)) || request.headers.get('sec-fetch-site')==='cross-site') throw new AppError('Origem não permitida.',403);
      if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json') throw new AppError('Envie os dados em JSON.',415);
    }
    const path = new URL(request.url).pathname;
    const service = new Inventory(env.DB,user.userId);
    await service.seed();
    if(request.method==='GET' && path==='/api/state') return reply(await service.snapshot());
    if(request.method==='GET' && path==='/api/export') {
      const {products} = await service.snapshot();
      const cell = (v:unknown) => { let s=String(v); if(/^[=+@-]/.test(s.trimStart())) s="'"+s; return '"'+s.replaceAll('"','""')+'"'; };
      const rows = [['Código','Produto','Categoria','Unidade','Saldo','Mínimo','Preço unitário (R$)'],
        ...products.map(p=>[p.sku,p.name,p.category,p.unit,p.stock,p.min_stock,(p.price_cents/100).toFixed(2).replace('.',',')])];
      return new Response('\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="estoque.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }
    if(!write) throw new AppError('Página não encontrada.',404);
    const reader=request.body?.getReader(); let size=0; const chunks:Uint8Array[]=[];
    if(reader) { while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>16384) {await reader.cancel(); throw new AppError('Requisição maior que 16 KB.',413);} chunks.push(value); } }
    let data:Record<string,unknown>;
    try { const bytes=new Uint8Array(size); let pos=0; for(const chunk of chunks) {bytes.set(chunk,pos);pos+=chunk.length;} data=JSON.parse(new TextDecoder().decode(bytes)); }
    catch {throw new AppError('JSON inválido.');}
    if(!data || typeof data!=='object' || Array.isArray(data)) throw new AppError('Envie um objeto JSON.');
    if(request.method==='POST' && path==='/api/products') return reply(await service.create(data),201);
    if(request.method==='POST' && path==='/api/movements') return reply(await service.move(data),201);
    const match=/^\/api\/products\/(\d+)$/.exec(path);
    if(match) {
      const id=integer(match[1],'Produto',1,2147483647);
      if(request.method==='PUT') return reply(await service.update(id,data));
      if(request.method==='DELETE') return reply(await service.archive(id,data));
    }
    throw new AppError('Operação não encontrada.',404);
  } catch(e) {
    if(e instanceof AppError) return reply({error:e.message},e.status);
    console.error('Falha na operação de estoque',e);
    return reply({error:'Não foi possível concluir a operação. Atualize a página e confira o histórico antes de tentar novamente.'},503);
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
