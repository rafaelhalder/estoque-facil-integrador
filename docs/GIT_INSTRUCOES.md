# Versionamento e publicação do código

O ZIP inclui os arquivos do projeto e HISTORICO_GIT.bundle, uma cópia portátil do repositório Git local. Não há repositório remoto criado nem publicação na internet.

Para recuperar o código com seu histórico, extraia o ZIP em uma pasta comum, abra o terminal nessa pasta e execute:

```powershell
git clone HISTORICO_GIT.bundle estoque-facil-com-historico
```

O bundle foi verificado com Git. Os arquivos de distribuição e o próprio bundle não precisam fazer parte do histórico do projeto. Se o Git não aceitar um caminho que contenha um nome reservado do Windows, extraia em outra pasta, como `Documentos/EstoqueFacil`.

## Ao usar o ZIP em outra pasta

Se preferir começar um novo histórico, com Git instalado abra o terminal dentro da pasta extraída:

```powershell
git init -b main
git add .
git commit -m "Adicionar projeto Estoque Facil"
```

Se o Git solicitar identidade, configure seu nome e e-mail de acordo com suas preferências antes do commit. Não use os dados de outra pessoa. A pasta `data`, arquivos temporários e ambientes virtuais estão no `.gitignore`.

## Publicar depois de revisar

Crie um repositório vazio no GitHub com o nome desejado. Depois copie a URL que o próprio GitHub mostrar e execute:

```powershell
git remote add origin URL_DO_REPOSITORIO_CRIADO
git push -u origin main
```

Substitua `URL_DO_REPOSITORIO_CRIADO` pela URL real. Forneça à tutoria acesso compatível com a forma de entrega e inclua o link no template oficial. Antes de publicar, revise a identificação e as capturas. Nunca envie senhas, chaves, dados de clientes ou bancos pessoais.

Os commits locais produzidos na preparação deste pacote identificam o assistente como Codex, sem atribuir falsamente sua autoria ao aluno. O aluno deve revisar e compreender o trabalho e observar as regras da instituição para uso de IA.
