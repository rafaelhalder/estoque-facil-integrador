type Data = Record<string, unknown>;
type Row = Record<string, any>;
export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function integer(value: unknown, label: string, min = 0, max = 1000000) {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+$/.test(String(value)))
    throw new AppError(`${label} deve ser um número inteiro.`);
  const result = Number(value);
  if (String(value).length > 10 || !Number.isSafeInteger(result) || result < min || result > max)
    throw new AppError(`${label} deve estar entre ${min} e ${max}.`);
  return result;
}
function text(value: unknown, label: string, min = 0, max = 100) {
  if (typeof value !== 'string') throw new AppError(`${label} deve ser texto.`);
  const result = value.trim();
  if ([...result].length < min || [...result].length > max || /[\x00-\x1f]/.test(result))
    throw new AppError(`${label} deve ter entre ${min} e ${max} caracteres, sem caracteres de controle.`);
  return result;
}
function fields(data: Data) {
  const sku = text(data.sku ?? '', 'Código', 2, 30).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(sku)) throw new AppError('Código deve conter apenas letras, números, hífen ou sublinhado.');
  const name = text(data.name ?? '', 'Nome', 2, 100);
  const category = text(data.category ?? '', 'Categoria', 0, 50);
  const unit = data.unit ?? 'un';
  if (unit !== 'un' && unit !== 'cx' && unit !== 'pct') throw new AppError('Unidade inválida. Use un, cx ou pct.');
  const rawPrice = data.price ?? '0';
  if ((typeof rawPrice !== 'string' && typeof rawPrice !== 'number') || !/^\d+(?:[.,]\d{1,2})?$/.test(String(rawPrice).trim()))
    throw new AppError('Preço deve ser um valor decimal com até duas casas.');
  const parts = String(rawPrice).trim().replace(',', '.').split('.');
  const cents = Number(parts[0]) * 100 + Number((parts[1] ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > 100000000) throw new AppError('Preço deve estar entre 0 e 1.000.000.');
  return [sku, name, category, unit, cents, integer(data.min_stock ?? 0, 'Estoque mínimo')];
}
export class Inventory {
  constructor(private db: D1Database, private owner: string) {}
  private query(sql: string, ...values: any[]) { return this.db.prepare(sql).bind(...values); }
  async seed() {
    if (await this.query('SELECT owner_id FROM participants WHERE owner_id=?',this.owner).first()) return;
    const samples = [
      ['PAP-001','Caderno universitário','Papelaria','un',1890,10,32],
      ['PAP-002','Caneta esferográfica azul','Papelaria','un',250,20,12],
      ['ORG-001','Pasta organizadora','Organização','un',1250,8,18],
      ['ESC-001','Grampeador de mesa','Escritório','un',2990,5,4],
      ['PAP-003','Bloco de notas adesivas','Papelaria','un',690,10,24],
      ['ESC-002','Tesoura de uso geral','Escritório','un',1590,5,0],
    ];
    // O lote e a marca do participante impedem duplicação em acessos simultâneos.
    const statements: D1PreparedStatement[] = [];
    for (const sample of samples) {
      const [sku,name,category,unit,price,min,stock] = sample;
      const token = crypto.randomUUID();
      statements.push(this.query(`INSERT INTO products(owner_id,token,sku,name,category,unit,price_cents,min_stock)
        SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM participants WHERE owner_id=?)`,
        this.owner,token,sku,name,category,unit,price,min,this.owner));
      if (stock) statements.push(this.query(`INSERT INTO movements(token,product_id,kind,quantity,note,balance_after)
        SELECT ?,id,'entrada',?,'Estoque inicial da demonstração',? FROM products WHERE token=?`,crypto.randomUUID(),stock,stock,token));
    }
    statements.push(this.query('INSERT OR IGNORE INTO participants(owner_id) VALUES (?)',this.owner));
    await this.db.batch(statements);
  }
  async snapshot() {
    const result = await this.db.batch([
      this.query('SELECT * FROM products WHERE owner_id=? AND active=1 ORDER BY name COLLATE NOCASE',this.owner),
      this.query(`SELECT m.*,p.name AS product_name,p.sku,p.unit FROM movements m JOIN products p ON p.id=m.product_id
        WHERE p.owner_id=? ORDER BY m.id DESC LIMIT 500`,this.owner),
    ]);
    const products = result[0].results as Row[];
    return { products, movements:result[1].results, demo:true, movement_limit:500, summary: {
      products:products.length, units:products.reduce((n,p)=>n+p.stock,0),
      low_stock:products.filter(p=>p.stock<=p.min_stock).length,
      value_cents:products.reduce((n,p)=>n+p.stock*p.price_cents,0),
    }};
  }
  private async product(id: number) {
    const product = await this.query('SELECT * FROM products WHERE id=? AND owner_id=? AND active=1',id,this.owner).first<Row>();
    if (!product) throw new AppError('Produto não encontrado ou arquivado.',404);
    return product;
  }
  async create(data: Data) {
    const values = fields(data), stock = integer(data.initial_stock ?? 0,'Estoque inicial');
    const token = crypto.randomUUID();
    const statements = [this.query(`INSERT INTO products(owner_id,token,sku,name,category,unit,price_cents,min_stock)
      SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM products WHERE owner_id=?)<200`,this.owner,token,...values,this.owner)];
    if (stock) statements.push(this.query(`INSERT INTO movements(token,product_id,kind,quantity,note,balance_after)
      SELECT ?,id,'entrada',?,'Estoque inicial do cadastro',? FROM products WHERE token=? AND owner_id=?`,crypto.randomUUID(),stock,stock,token,this.owner));
    try { await this.db.batch(statements); }
    catch (e) { if (String(e).includes('UNIQUE')) throw new AppError('Este código já foi utilizado. Escolha outro código, inclusive se o produto anterior foi arquivado.',409); throw e; }
    const product = await this.query('SELECT * FROM products WHERE token=? AND owner_id=?',token,this.owner).first<Row>();
    if (!product) throw new AppError('O ambiente de testes permite até 200 produtos por participante.',409);
    return product;
  }
  async update(id: number, data: Data) {
    const values = fields(data), version = integer(data.version,'Versão',1,2147483647);
    await this.product(id);
    try {
      const result = await this.query(`UPDATE products SET sku=?,name=?,category=?,unit=?,price_cents=?,min_stock=?,
        version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND owner_id=? AND active=1 AND version=? RETURNING *`,...values,id,this.owner,version).first<Row>();
      if (!result) throw new AppError('Este produto mudou em outra janela. Atualize a página antes de editar.',409);
      return result;
    } catch(e) { if(String(e).includes('UNIQUE')) throw new AppError('Este código já foi utilizado por outro produto.',409); throw e; }
  }
  async archive(id: number, data: Data) {
    const version = integer(data.version,'Versão',1,2147483647);
    await this.product(id);
    const result = await this.query(`UPDATE products SET active=0,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id=? AND owner_id=? AND active=1 AND version=? AND stock=0 RETURNING id`,id,this.owner,version).first();
    if(!result) throw new AppError('Só é possível arquivar com saldo zero. Se o produto mudou em outra janela, atualize a página.',409);
    return {message:'Produto arquivado. O histórico foi preservado.'};
  }
  async move(data: Data) {
    const id = integer(data.product_id,'Produto',1,2147483647);
    const quantity = integer(data.quantity,'Quantidade',1);
    const kind = data.kind;
    if(kind !== 'entrada' && kind !== 'saida') throw new AppError('Selecione entrada ou saída.');
    const note = text(data.note ?? '','Observação',0,250), delta = kind==='entrada' ? quantity : -quantity;
    await this.product(id);
    const token = crypto.randomUUID();
    // O INSERT calcula o saldo e o gatilho atualiza o produto na mesma operação atômica.
    const result = await this.query(`INSERT INTO movements(token,product_id,kind,quantity,note,balance_after)
      SELECT ?,id,?,?,?,stock+? FROM products WHERE id=? AND owner_id=? AND active=1 AND stock+? BETWEEN 0 AND 1000000
      AND (SELECT COUNT(*) FROM movements m JOIN products p ON p.id=m.product_id WHERE p.owner_id=?)<10000 RETURNING *`,
      token,kind,quantity,note,delta,id,this.owner,delta,this.owner).first<Row>();
    if(!result) {
      const current = await this.product(id);
      if(current.stock+delta<0) throw new AppError(`Saldo insuficiente. Disponível: ${current.stock} ${current.unit}.`,409);
      if(current.stock+delta>1000000) throw new AppError('A movimentação ultrapassa o limite de 1.000.000 unidades por produto.',409);
      throw new AppError('Movimentação não registrada. Atualize a página. O ambiente de testes permite até 10.000 movimentos por participante.',409);
    }
    return result;
  }
}
