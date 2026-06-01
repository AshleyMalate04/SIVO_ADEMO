# Correcções gerais ADEMO — V6

## Realtime

- Configuração do Echo/Reverb foi estabilizada no frontend.
- O hook `useElectionRealtime` agora escuta canais globais e por eleição:
  - `ademo.results`;
  - `ademo.elections`;
  - `election.{id}`.
- A página de eleições, resultados, selecção de eleições e portal do eleitor actualizam dados quando recebe eventos.
- O backend dispara evento quando:
  - o estado da eleição muda manualmente;
  - o estado da eleição muda automaticamente;
  - resultados presenciais são guardados/aprovados;
  - resultados finais são publicados.
- Foi registado `Schedule::command('elections:sync-statuses')->everyMinute()` para actualizar estados automaticamente com `php artisan schedule:work`.

## Filtros de estado

- Criado `StatusNormalizer` no backend.
- Criado `normalizeStatus` no frontend.
- Os filtros passam a aceitar variações como `Activo`, `ACTIVE`, `Suspenso`, `SUSPENDED`, `Em votação`, `EM_VOTACAO`.
- Listagens deixaram de remover todos os registos inactivos antes dos filtros; agora os filtros conseguem localizar activos, suspensos e desactivados.
- Selects de registo continuam a usar apenas entidades activas quando necessário.

## Resultados presenciais

- O fluxo de publicação foi enquadrado na tela de resultados.
- Ao publicar uma eleição concluída, o sistema pergunta se houve votos presenciais.
- Se sim, direcciona para registar totais presenciais.
- Se não, publica apenas os resultados online.
- Os resultados presenciais só podem ser guardados/aprovados quando a eleição está concluída.
- Todas as acções ficam registadas na auditoria.

## Auditoria

- Limite de carregamento aumentado para reduzir falta de logs.
- Agendamento, alterações de estado, votos presenciais e publicação continuam a gerar auditoria.

## Usabilidade

- Botões de “Visualizar” em separadores foram ocultados quando não havia opção de registo para aquele perfil.
- Toasts informativos desnecessários de cliques em acções de tabela foram removidos.
- Mantiveram-se toasts de sucesso e erro.
