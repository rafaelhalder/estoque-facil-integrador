# Como recuperar e publicar o projeto no Git

O ZIP traz o código e o arquivo `HISTORICO_GIT.bundle`, que guarda uma cópia do repositório local. O repositório público está em https://github.com/rafaelhalder/estoque-facil-integrador. Esse link abre o código e a documentação. A demonstração em funcionamento está em https://estoque-facil-rafael-testes.wryriver35.chatgpt.site. O código da adaptação online fica em online/.

## Recuperar com o histórico

Extraia o ZIP, abra um terminal na pasta do projeto e execute:

```powershell
git clone HISTORICO_GIT.bundle estoque-facil-com-historico
```

O Git vai criar a pasta `estoque-facil-com-historico`. O bundle foi conferido antes de entrar no pacote.

Se o Git recusar um caminho por causa de um nome reservado do Windows, extraia em uma pasta comum, como `Documentos/EstoqueFacil`.

## Começar outro histórico

Se preferir usar os arquivos sem recuperar os commits anteriores, execute na pasta extraída:

```powershell
git init -b main
git add .
git commit -m "Adicionar projeto Estoque Facil"
```

Se o Git pedir nome e e-mail, configure os seus dados antes do commit. A pasta `data`, os arquivos temporários e o próprio bundle ficam fora do versionamento pelo `.gitignore`.

## Usar o repositório publicado

Para conectar uma cópia local ao repositório do projeto, use:

```powershell
git remote add origin https://github.com/rafaelhalder/estoque-facil-integrador.git
git push -u origin main
```

Se o remoto origin já existir, confira o endereço com `git remote -v` antes de alterar qualquer configuração. O repositório é público e pode ser consultado pela tutoria. Coloque o link no template da entrega. Revise os arquivos antes de publicar para não enviar senhas, bancos pessoais ou dados de clientes.

Os commits de preparação estão identificados como Codex, pois houve apoio do assistente na implementação e nos textos. O histórico mantém essa informação; a revisão do material e as regras de autoria da instituição continuam fazendo parte da preparação da entrega.
