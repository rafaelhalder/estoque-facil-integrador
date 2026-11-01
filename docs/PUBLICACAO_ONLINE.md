# Publicação e conferência da demonstração

Publicado em 01/11/2026: https://estoque-facil-rafael-testes.wryriver35.chatgpt.site

O Sites confirmou a publicação da versão 1, com estado `succeeded`. O público foi configurado para permitir o acesso pelo link. A página inicial e o formulário são públicos. Para ler ou alterar o estoque, é preciso entrar com ChatGPT; o servidor verifica a conta e restringe os registros a ela.

O servidor online usa TypeScript, Vinext, Workers e D1. A versão acadêmica local em Python continua no pacote. Os bancos são separados. O código da adaptação está em `online/`.

## O que foi conferido

- 11 testes automatizados do serviço online passaram, sem falhas: criação, validação, saldo, histórico, isolamento de participantes, edição concorrente, arquivamento e restrições do banco.
- A checagem de tipos do TypeScript e o build passaram.
- 10 verificações HTTP passaram no D1 local. Incluíram autenticação, origem das escritas, tipo e tamanho do corpo, cadastro, CSV e duas saídas simultâneas. Resultado em `resultado_http_online.json`.
- No Chrome, a demonstração local aceitou o cadastro `QA-ONLINE`, com saldo 5, e bloqueou a tentativa de saída de 6.
- No endereço publicado, a entrada com ChatGPT foi concluída e os seis produtos de exemplo foram carregados. O produto `QA-HOSPEDADO`, chamado “Verificação técnica do assistente”, foi cadastrado com saldo 2 e permaneceu salvo depois de recarregar a página. Esse registro é técnico e fica apenas no estoque da conta usada na conferência.

Essas conferências foram feitas pelo assistente. Não são pareceres de colegas ou profissionais e não contam para as cinco avaliações exigidas. Os cinco retornos reais continuam pendentes.

## Identificação da versão hospedada

- Projeto Sites: `appgprj_6ae73e5783848191820f23c6b509bc84`.
- Commit do repositório de hospedagem: `0bdc05396702c64c4b70a115b64ecf33a29fac37`.
- Versão salva: `appgprj_6ae73e5783848191820f23c6b509bc84~appgver_b5d7b540178c819187a0c5b749c59f41`.
- Publicação: `appgdep_6ae740366194819181169a8dcc0f522e`.

O repositório acadêmico no GitHub também contém a cópia do código online e as instruções de teste.
