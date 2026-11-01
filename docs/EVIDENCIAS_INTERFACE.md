# Verificação funcional da interface

Data: 01/11/2026. Ambiente: Google Chrome no Windows. Verificação técnica realizada pelo assistente, em base exclusiva de QA, com dados fictícios. Não corresponde a avaliação de um colega ou profissional convidado.

| Caso | Procedimento e resultado observado |
| --- | --- |
| UI01 | Abrir demonstração: painel carregou seis produtos, soma de quantidades 90, três alertas e valor R$ 1.145,00. |
| UI02 | Cadastrar QA-001 com nome Produto de validação, preço R$ 15,00, saldo 4 e mínimo 2: item exibido no catálogo. |
| UI03 | Registrar entrada de 3: saldo exibido passou a 7. |
| UI04 | Tentar saída de 8: mensagem Saldo insuficiente; saldo permaneceu 7. Captura em imagens/saldo-insuficiente.jpg. |
| UI05 | Registrar saída válida de 5: saldo exibido 2, situação Repor estoque. |
| UI06 | Editar nome para Produto de validação revisado: nome atualizado; saldo continuou 2. |
| UI07 | Buscar validacao sem acento: produto com validação no nome foi encontrado. |
| UI08 | Tentar arquivar com saldo 2: bloqueio com mensagem para zerar o saldo. |
| UI09 | Registrar saída final de 2 e arquivar: confirmação de arquivamento; produto não apareceu no catálogo filtrado. |
| UI10 | Consultar histórico buscando QA-001: quatro lançamentos preservados, com saldos 4, 7, 2 e 0. Captura em imagens/historico-teste.jpg. |
| UI11 | Inspecionar painel em largura de 390 pixels: navegação reorganizada no topo e indicadores em duas colunas. Captura em imagens/celular.jpg. |
| UI12 | Abrir formulário de avaliação vazio: dez tarefas e campos de relato renderizados sem respostas fictícias. |

As capturas painel.jpg e produtos.jpg mostram os dados de demonstração antes e depois do arquivamento do item temporário. O cadastro temporário não está no banco padrão de quem extrair o ZIP, pois os bancos de QA não acompanham a distribuição.

A exportação CSV foi verificada pelos testes de integração HTTP. A impressão do formulário, avaliações de cinco pessoas e o vídeo narrado ainda dependem de execução pelo aluno. Não foi realizada auditoria completa de acessibilidade nem teste em todos os navegadores.
