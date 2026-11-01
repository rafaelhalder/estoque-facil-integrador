import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home() {
  const user=await getChatGPTUser();
  return <main style={{maxWidth:780,margin:'8vh auto',padding:'32px 24px'}}>
    <p className="eyebrow">PROJETO INTEGRADOR · AVALIAÇÃO DO SISTEMA</p>
    <h1 style={{fontSize:'clamp(34px,6vw,56px)',lineHeight:1.12,margin:'20px 0'}}>Estoque organizado.<br/>Agora, quero sua opinião.</h1>
    <p className="muted" style={{fontSize:18,lineHeight:1.7}}>O Estoque Fácil ajuda a cadastrar produtos, registrar entradas e saídas e acompanhar o que precisa de reposição.</p>
    <section className="panel" style={{padding:28,marginTop:28}}>
      <h2>Como testar</h2>
      <ol style={{paddingLeft:22,lineHeight:1.9,margin:'18px 0'}}>
        <li>Entre com sua conta do ChatGPT e abra a demonstração.</li>
        <li>Cadastre um produto, registre uma entrada e uma saída e confira o histórico.</li>
        <li>Tente retirar mais do que o saldo, busque produtos e exporte o CSV.</li>
        <li>Preencha a avaliação, salve em PDF e envie para o Rafael.</li>
      </ol>
      <p className="muted">Cada conta tem um estoque separado, com produtos fictícios para começar. Os registros ficam salvos online. Use apenas dados de teste.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:24}}>
        <a className="primary" href={user?'/estoque':chatGPTSignInPath('/estoque')} target="_top">{user?'Abrir meu estoque de teste':'Entrar com ChatGPT e testar'} ↗</a>
        <a className="secondary" href="/avaliacao.html">Preencher avaliação</a>
      </div>
    </section>
    <p className="muted" style={{marginTop:24,fontSize:13}}>A avaliação pede nome, data, o que funcionou, problemas, funções que ficaram sem teste e sugestões. As respostas do formulário só são enviadas ao Rafael quando você compartilha o arquivo salvo.</p>
    <p style={{marginTop:20,fontSize:13}}><a href="https://github.com/rafaelhalder/estoque-facil-integrador" target="_blank" rel="noopener noreferrer">Ver o código do projeto no GitHub ↗</a></p>
  </main>;
}
