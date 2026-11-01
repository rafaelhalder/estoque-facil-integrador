# Conferência da interface

Data: 01/11/2026. Ambiente: Google Chrome no Windows. Conferência técnica feita pelo assistente, com dados fictícios em uma base separada para testes (QA). As cinco avaliações de colegas ou profissionais ainda não foram feitas.

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

As imagens painel.jpg e produtos.jpg mostram a demonstração antes e depois do teste de arquivamento. O produto criado no teste não vai aparecer para quem abrir o ZIP: o banco de QA fica fora do pacote.

Os testes da API conferiram a exportação CSV. Ainda faltam as cinco avaliações reais, a impressão dos formulários e o vídeo narrado. A conferência não cobre todos os navegadores nem substitui uma avaliação completa de acessibilidade.
