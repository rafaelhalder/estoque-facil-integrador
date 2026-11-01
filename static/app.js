'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = cents => (cents / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
const number = value => value.toLocaleString('pt-BR');
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let state = {products: [], movements: [], summary: {products: 0, units: 0, low_stock: 0, value_cents: 0}};
let editing = null, archiving = null, toastTimer, loading = false, busy = false;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function toast(message, error = false) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').className = error ? 'toast error' : 'toast';
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
async function api(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(path, {...options, headers: {'Content-Type': 'application/json', ...options.headers}, signal: controller.signal});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('A resposta demorou. Atualize a página para conferir se a operação foi registrada antes de tentar novamente.');
    if (error instanceof TypeError) throw new Error('Conexão indisponível. Confira o terminal do aplicativo.');
    throw error;
  } finally { clearTimeout(timer); }
}
async function refresh() {
  if (loading) return;
  loading = true;
  try {
    state = await api('/api/state');
    $('#connection-error').hidden = true;
    $('#mode-badge').textContent = state.demo ? 'Dados de demonstração' : 'Ambiente local';
    $('#sync-status').textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    render();
  } catch (error) {
    $('#connection-error').hidden = false;
    $('#sync-status').textContent = 'Sem conexão · dados podem estar desatualizados';
  } finally { loading = false; }
}
function route() {
  const page = location.hash.slice(1);
  const current = ['overview', 'products', 'movements'].includes(page) ? page : 'overview';
  const pages = {overview: ['Visão geral', 'Acompanhe os produtos e saiba o que precisa de atenção.'], products: ['Produtos', 'Um catálogo organizado para uma rotina mais simples.'], movements: ['Movimentações', 'Acompanhe as entradas, saídas e o saldo após cada operação.']};
  for (const key of Object.keys(pages)) $(`#${key}-page`).hidden = key !== current;
  $$('nav a').forEach(link => { if (link.dataset.page === current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  $('#page-title').textContent = pages[current][0];
  $('#breadcrumb-title').textContent = pages[current][0];
  $('#page-description').textContent = pages[current][1];
  document.title = `Estoque Fácil | ${pages[current][0]}`;
}
function badge(product) {
  if (product.stock === 0) return element('span', 'Sem estoque', 'pill pill-zero');
  if (product.stock <= product.min_stock) return element('span', 'Repor estoque', 'pill pill-low');
  return element('span', 'Em dia', 'pill pill-ok');
}
function productCell(product, avatar = true) {
  const wrapper = element('div', undefined, 'product-cell');
  if (avatar) wrapper.append(element('span', product.name.slice(0, 2).toUpperCase(), 'product-avatar'));
  const names = element('div');
  names.append(element('span', product.name, 'item-name'), element('span', product.sku, 'item-code mono'));
  wrapper.append(names);
  return wrapper;
}
function empty(container, title, description) {
  const box = element('div', undefined, 'empty-state');
  box.append(element('strong', title), element('span', description));
  container.replaceChildren(box);
}
function table(container, headers, rows) {
  const result = element('table');
  const caption = element('caption', container.id === 'products-table' ? 'Produtos cadastrados' : 'Histórico de movimentações');
  caption.className = 'sr-only';
  result.append(caption);
  const head = element('thead'), headerRow = element('tr');
  headers.forEach(title => { const th = element('th', title); th.scope = 'col'; headerRow.append(th); });
  head.append(headerRow);
  const body = element('tbody');
  rows.forEach(cells => { const row = element('tr'); cells.forEach(value => { const cell = element('td'); if (value instanceof Node) cell.append(value); else cell.textContent = value; row.append(cell); }); body.append(row); });
  result.append(head, body); container.replaceChildren(result);
}
function action(label, callback, className = '', accessibleLabel = label) {
  const button = element('button', label, className); button.type = 'button'; button.setAttribute('aria-label', accessibleLabel); button.addEventListener('click', callback); return button;
}
function render() {
  const summary = state.summary;
  $('#metric-products').textContent = number(summary.products);
  $('#nav-count').textContent = summary.products;
  $('#metric-units').textContent = number(summary.units);
  $('#metric-low').textContent = number(summary.low_stock);
  $('#metric-value').textContent = money(summary.value_cents);
  const low = state.products.filter(product => product.stock <= product.min_stock).sort((a,b) => a.stock - b.stock);
  $('#attention-count').textContent = `${low.length} ${low.length === 1 ? 'item' : 'itens'}`;
  const attention = $('#attention-list'); attention.replaceChildren();
  if (!low.length) empty(attention, state.products.length ? 'Tudo em dia por aqui' : 'Seu estoque começa aqui', state.products.length ? 'Nenhum produto precisa de reposição neste momento.' : 'Cadastre o primeiro produto para acompanhar seus saldos.');
  low.slice(0,3).forEach(product => {
    const row = element('div', undefined, 'attention-item'), details = element('div', undefined, 'item-details');
    details.append(element('span', product.name, 'item-name'), element('span', product.sku, 'item-code mono'));
    const stock = element('div', undefined, 'stock-info'); stock.append(element('strong', `${number(product.stock)} ${product.unit}`), element('small', `Mín.: ${number(product.min_stock)}`));
    row.append(element('span', product.name.slice(0,2).toUpperCase(), 'product-avatar'), details, stock, action('Repor', () => openMovement(product.id), 'small-action', `Repor ${product.name}`)); attention.append(row);
  });
  $('#see-low').hidden = !low.length;
  $('#quick-movement').disabled = state.products.length === 0;
  $('#new-movement').disabled = state.products.length === 0;
  renderProducts(); renderMovements();
}
function renderProducts() {
  const query = normalize($('#product-search').value), status = $('#product-status').value;
  const products = state.products.filter(p => normalize(`${p.name} ${p.sku} ${p.category}`).includes(query) && (status === 'all' || (status === 'low' ? p.stock <= p.min_stock : p.stock > p.min_stock)));
  $('#products-result').textContent = `${products.length} de ${state.products.length} produtos`;
  const container = $('#products-table');
  if (!products.length) return empty(container, state.products.length ? 'Nenhum produto encontrado' : 'Catálogo vazio', state.products.length ? 'Tente outra busca ou altere o filtro.' : 'Clique em Novo produto para começar.');
  table(container, ['Produto', 'Categoria', 'Saldo', 'Preço unitário', 'Situação', 'Ações'], products.map(p => {
    const actions = element('div', undefined, 'row-actions');
    actions.append(action('Movimentar', () => openMovement(p.id), '', `Movimentar ${p.name}`), action('Editar', () => openProduct(p), '', `Editar ${p.name}`), action('Arquivar', () => openArchive(p), 'archive-action', `Arquivar ${p.name}`));
    return [productCell(p), p.category || 'Sem categoria', `${number(p.stock)} ${p.unit}`, money(p.price_cents), badge(p), actions];
  }));
}
function movementRows(movements, compact = false) {
  return movements.map(m => {
    const date = new Date(m.created_at);
    const quantity = element('span', `${m.kind === 'entrada' ? '+' : '−'}${number(m.quantity)} ${m.unit}`, `quantity-${m.kind === 'entrada' ? 'in' : 'out'}`);
    const kind = element('span', m.kind === 'entrada' ? '↙ Entrada' : '↗ Saída', `pill pill-${m.kind === 'entrada' ? 'in' : 'out'}`);
    const cells = [productCell({name: m.product_name, sku: m.sku}, !compact), kind, quantity, `${number(m.balance_after)} ${m.unit}`, date.toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})];
    if (!compact) cells.push(m.note || '—');
    return cells;
  });
}
function renderMovements() {
  const recent = $('#recent-table');
  if (!state.movements.length) empty(recent, 'Nenhuma movimentação ainda', 'As entradas e saídas aparecerão aqui.');
  else table(recent, ['Produto', 'Tipo', 'Quantidade', 'Saldo após', 'Data'], movementRows(state.movements.slice(0,4), true));
  const query = normalize($('#movement-search').value), kind = $('#movement-kind').value;
  const movements = state.movements.filter(m => (kind === 'all' || m.kind === kind) && normalize(`${m.product_name} ${m.sku} ${m.note}`).includes(query));
  $('#movements-result').textContent = `${movements.length} de ${state.movements.length} movimentações carregadas`;
  if (!movements.length) empty($('#movements-table'), 'Nenhuma movimentação encontrada', 'Registre uma movimentação ou ajuste os filtros.');
  else table($('#movements-table'), ['Produto', 'Tipo', 'Quantidade', 'Saldo após', 'Data', 'Observação'], movementRows(movements));
}
function formError(name, message) {
  const target = $(`#${name}-form-error`); target.textContent = message; target.hidden = !message;
}
function openProduct(product = null) {
  editing = product;
  const form = $('#product-form'); form.reset(); formError('product', '');
  $('#product-dialog-title').textContent = product ? 'Editar produto' : 'Novo produto';
  $('#save-product').textContent = product ? 'Salvar alterações' : 'Cadastrar produto';
  $('#initial-stock-label').hidden = !!product;
  form.elements.initial_stock.disabled = !!product;
  $('#product-hint').textContent = product ? 'Para alterar o saldo, registre uma entrada ou saída. Alterar o preço recalcula o valor atual do estoque.' : 'O saldo inicial será registrado como uma entrada no histórico.';
  form.elements.price.value = '0,00';
  if (product) {
    for (const key of ['name','sku','category','unit','min_stock']) form.elements[key].value = product[key];
    form.elements.price.value = (product.price_cents / 100).toFixed(2).replace('.', ',');
  }
  $('#product-dialog').showModal();
  form.elements.name.focus();
}
function openMovement(productId) {
  if (!state.products.length) return toast('Cadastre um produto antes de movimentar.', true);
  const form = $('#movement-form'); form.reset(); formError('movement', '');
  const select = $('#movement-product'); select.replaceChildren();
  state.products.forEach(p => { const option = element('option', `${p.name} · ${p.sku}`); option.value = p.id; select.append(option); });
  if (productId) select.value = productId;
  movementBalance(); $('#movement-dialog').showModal();
}
function movementBalance() {
  const product = state.products.find(p => p.id === Number($('#movement-product').value));
  $('#movement-balance').textContent = product ? `Saldo atual: ${number(product.stock)} ${product.unit} · Estoque mínimo: ${number(product.min_stock)} ${product.unit}` : '';
}
function openArchive(product) {
  archiving = product; formError('archive', '');
  $('#archive-description').textContent = `Deseja arquivar “${product.name}” (${product.sku})? Saldo atual: ${product.stock} ${product.unit}.`;
  $('#archive-dialog').showModal();
}
async function submit(form, button, kind, callback) {
  if (busy) return;
  formError(kind, '');
  if (!form.reportValidity()) return;
  busy = true; button.disabled = true;
  $$('.close-dialog', form).forEach(b => b.disabled = true);
  try { await callback(); } catch(error) { formError(kind, error.message); }
  finally { busy = false; button.disabled = false; $$('.close-dialog', form).forEach(b => b.disabled = false); }
}
$('#product-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget;
  submit(form, $('#save-product'), 'product', async () => {
    const data = Object.fromEntries(new FormData(form));
    if (editing) data.version = editing.version;
    await api(editing ? `/api/products/${editing.id}` : '/api/products', {method: editing ? 'PUT' : 'POST', body: JSON.stringify(data)});
    $('#product-dialog').close(); toast(editing ? 'Produto atualizado.' : 'Produto cadastrado.'); await refresh();
  });
});
$('#movement-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget;
  submit(form, $('#save-movement'), 'movement', async () => {
    await api('/api/movements', {method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});
    $('#movement-dialog').close(); toast('Movimentação registrada. Saldo atualizado.'); await refresh();
  });
});
$('#archive-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget;
  submit(form, $('#confirm-archive'), 'archive', async () => {
    const result = await api(`/api/products/${archiving.id}`, {method:'DELETE', body:JSON.stringify({version:archiving.version})});
    $('#archive-dialog').close(); toast(result.message); await refresh();
  });
});
$$('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); }));
$('#new-product').addEventListener('click', () => openProduct());
$('#quick-movement').addEventListener('click', () => openMovement());
$('#new-movement').addEventListener('click', () => openMovement());
$('#see-low').addEventListener('click', () => { $('#product-status').value = 'low'; $('#product-search').value = ''; location.hash = 'products'; renderProducts(); });
$('#movement-product').addEventListener('change', movementBalance);
$('#product-search').addEventListener('input', renderProducts);
$('#product-status').addEventListener('change', renderProducts);
$('#movement-search').addEventListener('input', renderMovements);
$('#movement-kind').addEventListener('change', renderMovements);
$('#retry').addEventListener('click', refresh);
window.addEventListener('hashchange', route);
window.addEventListener('focus', () => { if (!$$('dialog[open]').length && !busy) refresh(); });
$('#today').textContent = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
route(); refresh();
