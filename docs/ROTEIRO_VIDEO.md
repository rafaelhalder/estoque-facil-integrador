# Roteiro de apresentação do Estoque Fácil

Grave sua própria tela e narração. Este texto é uma orientação; ajuste as palavras ao que você compreendeu e verificou. O material do curso traz orientações diferentes sobre a duração (até cinco minutos em uma seção e pelo menos cinco em outra). Planeje aproximadamente cinco minutos e confirme a duração com a tutoria.

## Antes de gravar

- Abra `INICIAR_DEMONSTRACAO.bat` e confira que o navegador está mostrando o aplicativo.
- Abra também o código em um editor e o resultado de `TESTAR.bat`.
- Use dados fictícios; evite mostrar arquivos pessoais ou outras abas.
- Deixe o link do repositório e a identificação acadêmica prontos quando estiverem disponíveis.
- Só mencione testes com usuários depois que eles realmente ocorrerem.

## 0min00 a 0min40 — Problema e objetivo

Apresente o projeto: sistema local para um pequeno comércio controlar produtos, saldos e reposição. Explique que o cenário é hipotético e foi adotado para estudo. Mostre os quatro indicadores do painel e a lista de produtos com estoque baixo.

## 0min40 a 1min30 — Cadastro

Abra Produtos e cadastre um item fictício com código `VID-001`, nome `Produto da apresentação`, preço de R$ 10,00, saldo inicial 5 e mínimo 2. Mostre que o item aparece no catálogo. Explique que cada código deve ser único e que o saldo inicial gera uma entrada no histórico.

## 1min30 a 2min30 — Entrada, saída e erro tratado

Registre uma entrada de 3 unidades e confirme o saldo 8. Tente uma saída de 9 para mostrar a mensagem de saldo insuficiente. Depois registre uma saída válida de 6 e confira o saldo 2 e o alerta de reposição. Mostre o histórico com tipo, quantidade, saldo após e data.

## 2min30 a 3min15 — Edição e arquitetura

Edite o nome do produto sem alterar seu saldo. Mostre a separação entre `controllers.py`, `services.py`, `models.py` e `static`. Explique: o controlador recebe a requisição, o serviço valida os dados e o modelo usa SQLite. A atualização do saldo e a inclusão no histórico fazem parte da mesma transação.

## 3min15 a 4min00 — Banco e testes

Mostre as tabelas products e movements na documentação e o relacionamento de um produto para muitas movimentações. Mostre o resultado dos testes automatizados. Explique um caso: duas saídas de 4 unidades para um produto com saldo 5; apenas uma deve ser aceita.

## 4min00 a 4min40 — Validação e melhorias

Se a validação real estiver concluída, mostre o PDF das cinco avaliações e explique uma correção feita a partir delas. Caso ainda não esteja concluída, diga explicitamente que está pendente e não apresente a gravação como entrega final. Não transforme a revisão automática em opinião de colegas.

## 4min40 a 5min00 — Conclusão

Mostre a estrutura do repositório e as instruções de execução. Informe o limite: aplicação local de um usuário, sem autenticação nem uso pela internet. Encerre com o que aprendeu sobre validação, persistência e organização do código.
