# Auditoria técnica e de segurança — Sistema de Votação Eleitoral ADEMO

Data: 19 de setembro de 2026

## Âmbito analisado

- autenticação, recuperação de acesso, tokens e permissões da API;
- identidade e autorização do eleitor;
- concorrência no voto, mudança de estado e publicação de resultados;
- segredo do voto, comprovativos e auditoria;
- consultas Eloquent, agregações e índices;
- CORS, WebSocket/Reverb, uploads e exposição de ficheiros;
- dependências Composer/npm e configuração para Docker.

## Correções implementadas

### Voto e concorrência

- O voto, a marcação de participação e o comprovativo permanecem na mesma transação.
- A linha de `election_voters` usa `FOR UPDATE`; pedidos simultâneos do mesmo eleitor são serializados.
- A eleição e o candidato são validados novamente dentro da transação de voto.
- Mudanças manuais e automáticas de estado, resultados presenciais e publicação final agora bloqueiam a mesma linha da eleição. Isso impede voto durante encerramento e impede publicar enquanto os totais são alterados.
- Só são permitidas as transições `PROGRAMADA → EM_VOTACAO → CONCLUIDA`. `RESULTADOS_PUBLICADOS` só pode ser alcançado pelo endpoint de publicação, que verifica resultados presenciais pendentes.
- Foi criada uma restrição única em `vote_receipts (election_id, voter_hash)`. A base de dados passa a ser a última barreira contra comprovativos duplicados.
- O endpoint de voto mantém limite de 10 pedidos por minuto.

### Autenticação e identidade

- O vínculo entre conta de eleitor e membro passou a usar exclusivamente `users.access_code = members.member_code`. Email e telefone deixaram de poder associar uma conta ao membro errado.
- A senha inicial fixa `12345678`, solicitada para o processo operacional, não dá acesso às funcionalidades do sistema: o utilizador só pode alterar a própria senha até concluir o primeiro acesso.
- A limitação do login combina o limite global da rota com um limite adicional por código de acesso e IP.
- Tokens Sanctum expiram de acordo com `SANCTUM_EXPIRATION` (480 minutos no exemplo de produção).
- A recuperação de senha rejeita emails não registados ou inativos, conforme a regra solicitada. Esta escolha permite descobrir se um email existe; ver riscos residuais.
- `.env` está ignorado pelo Git e a verificação dos ficheiros versionados não encontrou credenciais reais.

### Queries e índices

- A consulta da auditoria deixou de executar uma consulta por linha. Os nomes das entidades são carregados em lotes, com teste que limita o total de queries.
- A paginação da auditoria tem limites no backend (1 a 1000 registos por pedido).
- Foram acrescentados índices para data, eleição e ação da auditoria.
- Permanecem os índices compostos para votação, eleitores, equipas, resultados presenciais, notificações e estados/datas das eleições.
- A apuração usa agregações `COUNT`/`SUM` por candidato, sem uma consulta por candidato.

### Docker e infraestrutura

- Existe agora um serviço `migrate` de execução única com `migrate --force --isolated`.
- Backend, queue, scheduler e Reverb só arrancam depois da migração terminar com sucesso.
- Foi removido o volume partilhado de `bootstrap/cache`, evitando vários contentores a sobrescreverem simultaneamente os caches do Laravel.
- Queue, scheduler e Reverb usam `init: true` para tratamento correto de sinais e encerramento.
- O backend comunica com Reverb pelo hostname interno `reverb:8080`; o navegador usa o hostname público atual.
- O proxy Docker passou a encaminhar fotografias e documentos de candidatos, além de API e WebSocket.
- Nginx recebeu cabeçalhos contra MIME sniffing, clickjacking, fuga de referrer e uma CSP inicial.

## Riscos residuais e recomendações

1. **Anonimato contra administrador da base:** `voted_at` e `votes.created_at` podem ser correlacionados em eleições pequenas. Para anonimato forte, separar urna e caderno eleitoral em bases/serviços distintos ou gravar votos em lotes.
2. **Auditoria alterável:** `audit_logs` não é um registo imutável e algumas gravações de auditoria não fazem parte da mesma transação da operação. Recomenda-se exportação assinada para armazenamento WORM ou uma cadeia de hashes ancorada externamente.
3. **Tokens no navegador:** o frontend ainda usa `localStorage`. A CSP reduz a superfície de XSS, mas cookies `HttpOnly`, `Secure` e `SameSite` oferecem proteção superior.
4. **Documentos públicos:** documentos de candidatos continuam no disco público. Se contiverem BI ou dados privados, devem passar para disco privado e download autenticado.
5. **Enumeração na recuperação:** rejeitar email desconhecido atende à regra atual, mas confirma a existência de contas. O padrão mais seguro é devolver sempre a mesma resposta.
6. **Senha inicial conhecida:** o bloqueio de primeiro acesso reduz o impacto, mas uma senha aleatória por utilizador continua mais segura. Deve manter limites de login e monitorização ativa.
7. **Teste concorrente real:** SQLite valida invariantes, mas não reproduz bloqueios PostgreSQL. Antes de uma eleição real, executar teste de carga concorrente num ambiente Docker/PostgreSQL equivalente à produção.
8. **Cópias de segurança:** testar restauração, não apenas criação do backup. Definir RPO/RTO, retenção, encriptação e cópia fora do servidor.

## Validação executada

- PHPUnit: 10 testes, 43 asserções, todos aprovados.
- Testes cobrem voto duplicado, unicidade de comprovativo, senha inicial bloqueada, email obrigatório no registo e limite de queries da auditoria.
- 18 migrações aplicadas; a migração de reforço de comprovativos/índices foi executada com sucesso.
- `composer audit`: nenhuma vulnerabilidade conhecida.
- `npm audit --omit=dev`: nenhuma vulnerabilidade conhecida.
- ESLint: zero erros e seis avisos anteriores de dependências de `useEffect`.
- Build de produção Vite concluído.
- `docker compose config --quiet` validou a composição; houve apenas um aviso local de permissão ao ficheiro de configuração do Docker Desktop.

## Checklist antes da produção

- preencher `.env.production` sem versioná-lo e definir `APP_KEY`, passwords, domínios CORS e origens Reverb;
- usar HTTPS no domínio público e `VITE_REVERB_SCHEME=https`/porta 443 quando aplicável;
- manter `APP_DEBUG=false` e `LOG_LEVEL=warning`;
- executar backup e ensaio de restauração;
- executar carga concorrente contra PostgreSQL e observar locks, latência e filas;
- configurar monitorização de HTTP 5xx, falhas de queue, SMTP, espaço em disco e conexões PostgreSQL;
- fazer rotação periódica de segredos SMTP, base de dados, Reverb e `APP_KEY` conforme procedimento controlado.
