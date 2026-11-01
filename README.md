# Estoque Fácil

Aplicação web local para cadastrar produtos, registrar entradas e saídas e consultar saldos. Projeto acadêmico desenvolvido do zero em Python, SQLite, HTML, CSS e JavaScript. Não depende de serviços pagos, conexão à internet ou pacotes de terceiros para funcionar.

## Executar no Windows

1. Extraia a pasta inteira do arquivo ZIP.
2. Tenha Python 3.10 ou superior instalado.
3. Abra `INICIAR_DEMONSTRACAO.bat`. O navegador abrirá com seis produtos fictícios.
4. Mantenha o terminal aberto enquanto usa a aplicação. Para encerrar, pressione Ctrl+C nele.

Endereço padrão: **http://127.0.0.1:8765**.

Para começar sem dados, abra `INICIAR_ESTOQUE_VAZIO.bat`. Os dois modos usam bancos diferentes e não misturam dados.

Alternativa pelo terminal, dentro desta pasta:

```powershell
python app.py --demo --open-browser
python app.py --port 8766
python -m unittest discover -s tests -v
```

Se a porta estiver ocupada, encerre a outra instância ou use `--port 8766`. Se o comando Python não for encontrado, instale Python pelo site oficial e habilite sua inclusão no PATH. Não é necessário executar `pip install`.

## O que funciona

- Cadastro e edição de produtos, com código único, categoria, unidade, preço e estoque mínimo.
- Registro de entradas e saídas com observação e data; saldo atualizado em transação.
- Bloqueio de saída acima do saldo, valores negativos, quantidades fracionárias e códigos duplicados.
- Painel com totais, valor estimado e alertas de reposição.
- Busca por nome, código e categoria, sem diferenciação de acentos.
- Histórico das últimas 500 movimentações, incluindo produtos arquivados.
- Arquivamento de produtos com saldo zero, preservando seu histórico.
- Exportação do catálogo ativo em CSV com proteção contra fórmulas.
- Interface adaptada a celular, rótulos acessíveis, navegação por teclado e diálogos com foco.
- Persistência em SQLite, controle de edição desatualizada e proteção contra saídas concorrentes indevidas.

## Organização e arquitetura MVC

```text
app.py                         Inicialização e argumentos da aplicação
estoque/models.py              Esquema SQLite, conexões e consultas de leitura
estoque/services.py            Validação, saldo, transações e regras de negócio
estoque/controllers.py         Rotas HTTP e respostas JSON/CSV
static/index.html              Estrutura da apresentação
static/style.css               Estilos e adaptação da interface
static/app.js                  Interações e chamadas à API
tests/                         Testes automatizados com bancos temporários
docs/                          Documentação, diagramas e evidências
data/                          Bancos criados na primeira execução, ignorados no Git
```

O controlador recebe a requisição, o serviço aplica regras de negócio e o modelo persiste os dados. A apresentação usa a API JSON para atualizar as telas. Todos os arquivos estáticos são locais; nenhuma informação é enviada a serviços externos.

## Dados e cópia de segurança

- Modo normal: `data/estoque.sqlite`.
- Demonstração: `data/demo.sqlite`.
- A carga de demonstração é fictícia, ocorre apenas uma vez e não substitui dados existentes.
- Para fazer backup, **encerre o aplicativo** e copie toda a pasta `data` para outro local. Para restaurar, encerre o aplicativo e substitua a pasta pelo backup, mantendo antes uma cópia da versão atual.
- As quantidades representam a unidade cadastrada (un, cx ou pct). O painel soma quantidades; não converte caixas em unidades.
- Valor do estoque = saldo atual × preço unitário atual. Não é cálculo fiscal, custo médio ou lucro.
- O histórico mostra o nome e o código atuais do produto, mesmo se ele foi editado depois da movimentação.

## Testes e documentação

Abra `TESTAR.bat` ou execute `python -m unittest discover -s tests -v`.

Os testes usam bases temporárias e verificam regras de negócio, transações, concorrência, persistência, API HTTP, CSV e isolamento da interface local. Consulte `docs/RELATORIO_TECNICO.pdf`, `docs/RELATORIO_TECNICO.html` e `docs/EVIDENCIAS_TESTES.txt`.

O roteiro de vídeo está em `docs/ROTEIRO_VIDEO.md`. O formulário preenchível para avaliação real de cinco pessoas está em `docs/VALIDACAO_USUARIOS.html`. Ele gera um JSON local por avaliador e pode ser impresso em PDF pelo navegador. Não há avaliações de usuários inventadas neste pacote.

## Limites da versão acadêmica

Aplicação de um usuário em uma única máquina. O servidor aceita conexões apenas em `127.0.0.1`, valida Host e origem e não oferece autenticação, operação em rede, multiempresa, recuperação de senha ou publicação na internet. Não exponha esta versão por túneis ou redirecionamento de porta. O servidor HTTP da biblioteca padrão atende à demonstração local, não a uma implantação pública.

O histórico é limitado a 500 linhas na interface; os registros anteriores permanecem no banco. Não há restauração de produtos arquivados pela interface nem exclusão de movimentações: um lançamento incorreto deve ser compensado por nova movimentação identificada na observação.

## Situação da entrega acadêmica

O código e a documentação técnica estão preparados para revisão e estudo. Este projeto foi iniciado do zero porque o trabalho anterior não estava disponível. A disciplina solicita continuidade do Projeto Integrador I; confirme com a tutoria se este novo projeto pode substituí-lo.

Ainda precisam ser feitos pelo aluno: identificação acadêmica (RGM e polo), revisão do código e da documentação, validação real com cinco colegas ou profissionais, registro das sugestões e correções pertinentes, gravação narrada da solução e transposição para o template oficial da disciplina. Consulte também as regras da instituição sobre uso de ferramentas de IA. Nenhuma entrega no portal ou publicação no GitHub foi feita por este pacote.
