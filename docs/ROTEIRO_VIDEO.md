# Minha apresentação do Estoque Fácil

Este é um roteiro de fala para você ensaiar e ajustar ao que consegue demonstrar. A parte principal pode ser usada como está depois de conferir o sistema. No trecho de avaliações, há duas opções: use apenas a que corresponder à situação real do projeto.

O material do curso fala em até cinco minutos em uma parte e pelo menos cinco em outra. O roteiro foi organizado para cerca de cinco minutos, contando as pausas e os cliques. Confirme a duração com a tutoria.

## Antes de gravar

Abra `INICIAR_DEMONSTRACAO.bat`, o código e o resultado de `TESTAR.bat`. Deixe as outras abas fechadas para não mostrar informações pessoais. Se já houver um produto `VID-001` de outro ensaio, use outro código ou retome os passos com um produto novo.

As indicações entre colchetes são ações na tela. Elas não fazem parte da fala.

## 0min00 a 0min40 - Apresentação

[Mostrar a visão geral.]

“Olá, eu sou o Rafael e vou apresentar o Estoque Fácil.

A ideia aqui é facilitar o controle de estoque de um pequeno comércio. Dá pra cadastrar os produtos, registrar o que entra e sai e ver o que precisa repor.

O exemplo usado no projeto é fictício. Esses produtos já vêm no modo de demonstração pra facilitar o teste.

Aqui no painel aparecem a quantidade de produtos, a soma dos saldos, os itens que precisam de atenção e o valor estimado do estoque.”

## 0min40 a 1min30 - Cadastro

[Abrir Produtos e clicar em Novo produto. Usar código VID-001, nome Produto da apresentação, preço 10,00, saldo inicial 5 e mínimo 2.]

“Vou cadastrar um produto pra mostrar como funciona.

Aqui eu informo o nome, um código, a categoria, a unidade e o preço. Também coloco quanto já tem em estoque e qual é a quantidade mínima.

Neste exemplo, o produto começa com cinco unidades e o mínimo é dois.

Depois de salvar, ele aparece no catálogo. O código precisa ser único, e o saldo inicial também fica registrado no histórico como uma entrada.”

## 1min30 a 2min30 - Entrada e saída

[Registrar entrada de 3. Depois tentar saída de 9 e, em seguida, saída de 6.]

“Agora vou registrar uma entrada de três unidades. O saldo, que era cinco, passou pra oito.

Se eu tentar tirar nove, o sistema bloqueia e mostra que não tem saldo suficiente. Essa tentativa não muda o estoque.

Vou fazer uma saída válida de seis. Agora sobraram duas unidades. Como esse é o mínimo cadastrado, o produto aparece como um item que precisa de reposição.

No histórico dá pra conferir o tipo da movimentação, a quantidade, a data e o saldo que ficou depois de cada lançamento.”

## 2min30 a 3min15 - Código e banco

[Editar o nome do produto. Depois mostrar as pastas static e estoque.]

“Também dá pra editar o cadastro sem alterar a quantidade. Pra mudar o saldo, o caminho é registrar uma entrada ou uma saída.

O projeto foi organizado em partes. A pasta static tem as telas, o CSS e o JavaScript. No Python, o controlador recebe os pedidos da tela, o serviço confere as regras e o modelo cuida do banco.

Essa divisão segue a ideia do MVC e facilita encontrar onde cada parte funciona.”

## 3min15 a 4min00 - Testes

[Mostrar o diagrama das tabelas e o resultado dos testes.]

“O banco é o SQLite, que fica salvo em um arquivo no computador. Uma tabela guarda os produtos e outra guarda as movimentações.

Quando uma movimentação é confirmada, o saldo e o histórico são atualizados juntos. Se alguma parte falhar, a operação é desfeita.

Na execução registrada, os 26 testes automatizados passaram. Um deles verifica duas saídas ao mesmo tempo: com saldo de cinco, duas saídas de quatro não podem ser aceitas juntas. Só uma passa.

Também houve uma conferência técnica dos principais fluxos no navegador.”

## 4min00 a 4min40 - Avaliações e melhorias

### Se as cinco avaliações ainda estiverem pendentes

“A parte de avaliação com cinco colegas ou profissionais ainda está pendente. O formulário já está preparado pra cada pessoa registrar o que funcionou, o que deu problema e as sugestões.

Depois desse retorno, as melhorias precisam ser analisadas, registradas e testadas. Os testes automáticos que mostrei não substituem essa avaliação das pessoas.”

### Se as cinco avaliações já estiverem concluídas

[Antes de gravar, substitua os campos abaixo apenas por informações das avaliações reais.]

“Aqui estão as cinco avaliações do sistema. Um ponto que apareceu foi [descrever a observação real]. A mudança feita foi [explicar a correção real]. Depois, [mostrar como a correção foi conferida].

As outras sugestões e as decisões sobre cada uma estão registradas junto com a documentação.”

## 4min40 a 5min00 - Encerramento

[Mostrar o README e o repositório, quando ele estiver publicado.]

“Esse é o Estoque Fácil. O sistema funciona localmente, em um computador, e ainda não tem login ou acesso pela internet.

O pacote reúne o código, os diagramas, o manual e os testes. A proposta é manter o controle de estoque simples e deixar cada movimentação fácil de conferir.

Obrigado.”

## Conferência final

Cronometre um ensaio. Ajuste as pausas e use palavras que sejam confortáveis pra você. Se alguma etapa ainda estiver pendente, apresente o vídeo como demonstração do andamento; a gravação final deve mostrar a situação real da entrega.
