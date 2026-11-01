# Estoque Fácil

O Estoque Fácil é um sistema simples para cadastrar produtos e controlar o que entra e sai do estoque. Ele mostra o saldo de cada item, avisa quando está na hora de repor e guarda o histórico das movimentações.

A versão local usa Python, SQLite, HTML, CSS e JavaScript. Funciona no próprio computador, sem precisar de internet ou instalação de bibliotecas extras.

Também há uma demonstração online para os avaliadores: **https://estoque-facil-rafael-testes.wryriver35.chatgpt.site**. Cada pessoa entra com sua conta do ChatGPT e recebe um estoque de teste separado. O formulário fica em **https://estoque-facil-rafael-testes.wryriver35.chatgpt.site/avaliacao.html**.

A adaptação online está na pasta `online/` e usa TypeScript, Vinext e banco D1. Ela reaproveita a interface e os fluxos do projeto; o servidor Python da versão local continua separado. Veja `docs/TESTE_COM_CINCO_PESSOAS.md`.

## Como abrir

1. Extraia a pasta inteira do ZIP.
2. Tenha Python 3.10 ou uma versão mais recente instalado.
3. Abra `INICIAR_DEMONSTRACAO.bat`. O navegador vai abrir com seis produtos fictícios para você conhecer o sistema.
4. Deixe a janela do terminal aberta enquanto usa o aplicativo. Para encerrar, pressione Ctrl+C nessa janela.

O endereço padrão é **http://127.0.0.1:8765**.

Se quiser começar sem produtos, abra `INICIAR_ESTOQUE_VAZIO.bat`. Esse modo usa outro banco, separado da demonstração.

Também dá para abrir pelo terminal, dentro da pasta do projeto:

```powershell
python app.py --demo --open-browser
```

Se a porta já estiver ocupada, encerre a outra instância ou execute `python app.py --port 8766`. Se o computador não reconhecer o comando Python, instale-o pelo site oficial e habilite a opção de adicionar ao PATH. Não precisa executar `pip install`.

## O que dá para fazer

- Cadastrar e editar nome, código, categoria, unidade, preço e estoque mínimo.
- Registrar entradas e saídas com quantidade e observação.
- Ver o saldo e os produtos que precisam de reposição.
- Buscar por nome, código ou categoria, com ou sem acentos.
- Consultar as últimas 500 movimentações.
- Arquivar produtos com saldo zero, mantendo o histórico.
- Baixar uma planilha CSV com os produtos ativos.

O sistema bloqueia códigos repetidos, quantidades inválidas e saídas maiores que o saldo. Também confere se o produto mudou em outra janela antes de salvar uma edição.

## Como o código está organizado

```text
app.py                  Abre o aplicativo e define as opções de execução
estoque/models.py       Cuida das conexões, tabelas e consultas do banco
estoque/services.py     Confere os dados e aplica as regras de estoque
estoque/controllers.py  Recebe as chamadas da interface e devolve as respostas
static/                 Contém as telas, os estilos e o JavaScript
tests/                  Contém os testes automatizados
docs/                   Reúne o relatório, os diagramas e as orientações
data/                   Guarda os bancos criados na primeira execução
```

Essa divisão segue a ideia do MVC: a tela apresenta os dados, o controlador recebe o pedido e o modelo cuida do banco. As regras ficam em um serviço separado. A interface usa a API JSON para conversar com o Python.

## Como os dados são guardados

O modo normal usa `data/estoque.sqlite`. A demonstração usa `data/demo.sqlite`. A carga fictícia entra uma única vez, apenas em uma base vazia.

Para fazer backup, **encerre o aplicativo** e copie toda a pasta `data`. Para restaurar, feche o sistema e coloque a cópia no lugar da pasta atual. Guarde antes uma cópia dos dados que já estavam ali.

O painel soma as quantidades cadastradas. Uma caixa continua sendo uma caixa; não há conversão para unidades. O valor do estoque usa o saldo e o preço atual de cada produto. Esse valor não representa lucro, custo médio ou cálculo fiscal.

O histórico mostra o nome e o código atuais do produto. Se você editar essas informações, elas também aparecem atualizadas nos lançamentos antigos. Para corrigir uma entrada ou saída errada, registre uma movimentação no sentido contrário e explique o motivo na observação.

## Testes e documentação

Abra `TESTAR.bat` ou execute:

```powershell
python -m unittest discover -s tests -v
```

Os 26 testes da versão 1.0 passaram na execução registrada em `docs/EVIDENCIAS_TESTES.txt`. Eles verificam cadastro, saldo, histórico, banco e API. A conferência feita no navegador está em `docs/EVIDENCIAS_INTERFACE.md`.

O relatório está em PDF e HTML, dentro de `docs`. A mesma pasta contém os diagramas, o roteiro de apresentação e `VALIDACAO_USUARIOS.html`, um formulário para cada uma das cinco pessoas que ainda precisam avaliar o sistema. O formulário permite salvar a resposta em JSON ou imprimir em PDF.

## Limites da versão local

O aplicativo foi preparado para uma pessoa usar em um único computador. Ele não tem login, acesso pela rede, sincronização entre máquinas ou integração fiscal. O servidor só recebe conexões em `127.0.0.1`; esta versão não deve ser publicada diretamente na internet.

A tela carrega as últimas 500 movimentações, mas os registros anteriores continuam no banco. Produtos arquivados não podem ser restaurados pela interface. As telas têm rótulos e recursos de navegação por teclado, mas ainda não passaram por uma avaliação completa de acessibilidade.

## Antes de entregar

O projeto começou do zero porque o trabalho anterior não estava disponível. Como a disciplina pede continuar o PIT I, ainda é preciso confirmar essa substituição com a tutoria.

Também faltam a identificação acadêmica, as cinco avaliações reais, os ajustes que surgirem dessas avaliações, o vídeo narrado e o preenchimento do template oficial. O código e os textos foram preparados com apoio de IA e precisam ser revisados e compreendidos antes da apresentação. O código está publicado em https://github.com/rafaelhalder/estoque-facil-integrador. A entrega ainda não foi enviada ao portal. A demonstração online também está disponível no link acima.

Repositório: **https://github.com/rafaelhalder/estoque-facil-integrador**.

Veja o passo a passo em `docs/ENTREGA.md` e as instruções de versionamento em `docs/GIT_INSTRUCOES.md`.
