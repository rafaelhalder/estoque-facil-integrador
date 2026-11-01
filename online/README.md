# Estoque Fácil online

Esta é a adaptação online do Estoque Fácil para os testes do Projeto Integrador. A versão original em Python e SQLite continua na raiz do [repositório acadêmico](https://github.com/rafaelhalder/estoque-facil-integrador).

O link é https://estoque-facil-rafael-testes.wryriver35.chatgpt.site. A página inicial explica o teste e dá acesso ao formulário de avaliação.

Para usar o estoque, a pessoa entra com sua conta do ChatGPT. A plataforma cuida da entrada; o aplicativo usa o identificador da conta para separar os registros. Cada participante começa com seis produtos fictícios. Os dados ficam salvos no banco D1, inclusive ao fechar o navegador. O formulário de avaliação fica no navegador até a pessoa salvar e enviar o arquivo para o Rafael.

## O que muda em relação à versão local

A interface e os fluxos de cadastro, edição, entrada, saída, histórico, busca e exportação foram reaproveitados. O servidor online usa TypeScript, Vinext e Cloudflare Workers com D1, pois o servidor Python local não foi preparado para exposição na internet. O banco online é separado dos arquivos SQLite do computador.

Cada consulta e alteração verifica a conta do participante no servidor. O saldo e o lançamento são atualizados juntos, por uma operação SQL com gatilho. Edições verificam a versão do registro. O ambiente permite até 200 produtos e 10.000 movimentos por participante e exibe as 500 movimentações mais recentes.

Esta é uma demonstração acadêmica. Use dados fictícios. As avaliações de cinco colegas ou profissionais continuam pendentes e não são substituídas pelos testes técnicos.

## Rodar e conferir

Use Node.js 22.13 ou mais recente e instale com `npm ci`. O projeto foi configurado com o starter do Sites; preserve os scripts de compilação e a integração `sites()` em `vite.config.ts`.

```powershell
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_colossal_darwin.sql
npm run dev
```

A migração acima é para uma base local nova. Não a repita em uma base já migrada. Mudanças futuras no esquema devem gerar novas migrações com `npm run db:generate`. A publicação pelo Sites aplica as migrações hospedadas.

No modo de desenvolvimento local, o starter simula a entrada do ChatGPT. Essa simulação não entra no build de produção. O login hospedado é controlado pelo Sites.

```powershell
npm test
node node_modules/typescript/bin/tsc --noEmit
```

Os testes verificam saldo, histórico, arquivamento, validação, edição concorrente e separação entre participantes. O adaptador de teste usa SQLite em memória; a API também foi conferida no D1 local.

## Onde ficam as partes principais

- `app/page.tsx`: orientação para quem vai testar.
- `app/estoque/route.ts` e `app/ui.ts`: interface de estoque com acesso autenticado.
- `app/api/[...path]/route.ts`: entrada das requisições e validação de acesso.
- `lib/inventory.ts`: regras e consultas, sempre com o participante identificado.
- `db/schema.ts` e `drizzle/`: tabelas, restrições e gatilhos.
- `public/`: JavaScript, estilos e formulário de avaliação.

O código foi preparado com apoio de IA e deve ser compreendido e revisado pelo aluno antes da apresentação.
