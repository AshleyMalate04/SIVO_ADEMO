# Documentacao dos ficheiros, metodos e fluxos do Sistema Eleitoral ADEMO

Documento criado em 01/06/2026 para explicar a funcao dos principais ficheiros do projecto, os metodos existentes, onde sao chamados, que dados recebem e que saida entregam ao frontend ou ao backend.

## 1. Visao geral do projecto

O projecto esta dividido em duas aplicacoes:

- `ademo-eleitoral-backend`: API Laravel. Guarda dados, valida regras, autentica utilizadores, controla permissoes, regista votos, calcula resultados, cria auditoria e envia notificacoes em tempo real.
- `ademo-eleitoral-frontend`: interface React/Vite. Mostra as telas, recebe dados do utilizador, chama a API, guarda token no navegador e apresenta respostas, erros, tabelas, formularios e graficos.

Fluxo basico:

1. O utilizador entra no frontend.
2. O frontend chama a API por `src/lib/api.js`.
3. A API Laravel recebe a rota em `routes/api.php`.
4. A rota chama um controller em `app/Http/Controllers/Api`.
5. O controller valida dados com `FormRequest`, consulta/actualiza `Models`, usa `Services` quando necessario e devolve JSON por `ApiResponse`.
6. O frontend recebe `response.data`, actualiza estado da pagina e mostra o resultado esperado.

Formato padrao de resposta da API:

```json
{
  "success": true,
  "message": "Mensagem da operacao",
  "data": {}
}
```

Em erro:

```json
{
  "success": false,
  "message": "Mensagem de erro",
  "errors": {}
}
```

## 2. Backend Laravel

### 2.1 `routes/api.php`

Funcao: define todas as rotas HTTP da API.

Como funciona:

- Rotas publicas: `health`, `auth/login`, `auth/forgot-password`, `auth/verify-code`, `auth/reset-password`.
- Rotas protegidas: usam `auth:sanctum` e `active`, logo exigem token Bearer e utilizador activo.
- Rotas por perfil: usam `role:...`, controladas por `CheckRole`.

Principais chamadas:

| Rota | Controller.metodo | Quem chama no frontend | Saida esperada |
|---|---|---|---|
| `POST /auth/login` | `AuthController@login` | `authService.login`, `LoginPage` | token, user, menu, redirect |
| `GET /auth/me` | `AuthController@me` | autenticacao/layout | dados do utilizador autenticado |
| `GET /delegations` | `DelegationController@index` | `delegationService.list` | lista paginada/lista normalizada |
| `POST /delegations` | `DelegationController@store` | formulario de delegacao | delegacao criada |
| `GET /organs` | `OrganController@index` | `organService.list` | orgaos e cargos |
| `POST /organs/{id}/positions` | `OrganController@storePosition` | formulario de orgao/cargo | cargo criado |
| `GET /members` | `MemberController@index` | `memberService.list` | membros |
| `POST /members` | `MemberController@store` | `MemberFormPage` | membro criado e possivelmente utilizador eleitor |
| `GET /users` | `UserController@index` | `userService.list` | utilizadores operacionais |
| `POST /users` | `UserController@store` | `OperationalUserFormPage` | utilizador criado |
| `PATCH /users/{id}/status` | `UserController@updateStatus` | `OperationalUsersPage` | estado actualizado |
| `GET /elections` | `ElectionController@index` | `electionService.list`, paginas de eleicoes/resultados | eleicoes filtradas por perfil |
| `POST /elections` | `ElectionController@store` | `ElectionCreatePage` | eleicao criada |
| `PUT /elections/{id}` | `ElectionController@update` | `ElectionCreatePage` | eleicao actualizada |
| `PATCH /elections/{id}/status` | `ElectionController@updateStatus` | detalhes/lista de eleicoes | novo estado da eleicao |
| `POST /elections/{id}/team` | `ElectionController@team` | `ElectionCreateTeamPage` | equipa definida |
| `GET /elections/{id}/candidates` | `CandidateController@byElection` | `candidateService.byElection`, boletim, resultados | candidatos da eleicao |
| `POST /elections/{id}/candidates` | `CandidateController@storeForElection` | `ElectionCandidateFormPage` | candidato criado |
| `PATCH /candidates/{id}/status` | `CandidateController@updateStatus` | pagina de candidatos | candidato aprovado/rejeitado/suspenso |
| `GET /elections/{id}/voters` | `ElectionVoterController@byElection` | `voterService.byElection` | eleitores autorizados |
| `POST /elections/{id}/voters` | `ElectionVoterController@storeForElection` | `ElectionVoterFormPage` | eleitores adicionados |
| `GET /voting/elections` | `VotingController@elections` | `voteService.elections`, `MyElectionsPage` | eleicoes disponiveis para o eleitor |
| `GET /voting/elections/{id}/ballot` | `VotingController@ballot` | `voteService.ballot`, `BallotPage` | boletim com candidatos |
| `POST /voting/elections/{id}/confirm` | `VotingController@confirm` | `voteService.confirm`, `BallotPage` | voto e comprovativo |
| `GET /results` | `ResultController@index` | `resultService.list`, `ResultsPage` | lista de eleicoes/resultados |
| `GET /results/{electionId}` | `ResultController@show` | `resultService.show`, `ResultDetailsPage` | totais por candidato, brancos, online e presencial |
| `POST /results/{electionId}/publish` | `ResultController@publish` | `resultService.publish`, `electionService.publishResults` | resultado publicado |
| `GET /audit` | `AuditController@index` | `auditService.list`, `AuditPage` | logs de auditoria |
| `GET /notifications` | `NotificationController@index` | `notificationService.list` | notificacoes do eleitor |
| `PUT /settings/password` | `SettingController@updatePassword` | `settingService.updatePassword`, `SettingsPage` | senha alterada |

### 2.2 Controllers da API

#### `app/Http/Controllers/Api/CrudController.php`

Funcao: controller base reutilizado por entidades simples. Evita repetir listar, criar, mostrar, actualizar e apagar/ocultar.

Metodos:

- `index(Request $request)`: lista registos. Aceita `include`, `status`, `show_inactive`, `q`, `sort_by`, `sort_direction`, `per_page`. Retorna paginacao em `data`.
- `store(Request $request)`: valida dados, cria registo, grava auditoria e retorna o registo criado com HTTP 201.
- `show(Request $request, id)`: procura um registo por ID e devolve com relacoes permitidas.
- `update(Request $request, id)`: valida, actualiza e devolve o registo fresco.
- `destroy(Request $request, id)`: se a tabela tem `status`, altera para `INACTIVE`; caso contrario elimina.
- `prepareData(array $data, ?Model $record)`: ponto de extensao usado por controllers filhos para ajustar dados antes de guardar.
- `requestedRelations(Request $request)`: controla que relacoes podem ser carregadas via `include`.
- `ensureBlankVoteRules(...)`: valida coerencia entre voto branco e candidato.
- `auditAction(...)`: traduz operacoes genericas em accoes de auditoria.
- `validated(Request $request)`: executa o `FormRequest` configurado no controller filho.

Chamado por: `DelegationController`, `DistritController`, `ProvinceController`, `OrganController`, `PositionController`, `MemberController`, `UserController`, `CandidateController`, `VoteController`, `VoteReceiptController`, `ElectionTeamController`, `ElectionVoterController`, `SettingController`.

Saida esperada: JSON padrao por `ApiResponse`.

#### `AuthController.php`

Funcao: controla login, logout e recuperacao de senha.

Metodos:

- `login(LoginRequest $request)`: recebe `access_code` e `password`, valida credenciais, bloqueia contas nao activas, remove tokens antigos, cria token Sanctum, actualiza `last_login_at` e devolve token, user, role, menu e rota de redirecionamento.
- `logout(Request $request)`: elimina o token actual e regista auditoria.
- `logoutAll(Request $request)`: elimina todos os tokens do utilizador.
- `me(Request $request)`: devolve utilizador autenticado com `delegation` e `setting`.
- `forgotPassword(Request $request)`: recebe email, gera codigo de 6 digitos, guarda hash em `password_reset_tokens` e envia email.
- `verifyCode(Request $request)`: confirma se o codigo existe, bate com o hash e ainda nao expirou.
- `resetPassword(Request $request)`: valida email, codigo e senha confirmada; actualiza password e remove tokens.
- `passwordResetEmailHtml(...)`: monta HTML do email.
- `validResetCode(...)`: verifica validade de 15 minutos e hash.
- `passwordMatches(...)`: compara senha; tambem suporta senha antiga em texto puro e regrava em hash.
- `redirectByRole(...)`: define para onde cada perfil vai apos login.
- `menuByRole(...)`: devolve menus autorizados por perfil.

Chamado por: `authService.js`, paginas `LoginPage`, `ForgotPasswordPage`, `VerifyCodePage`, `ResetPasswordPage`, `Sidebar`.

Saida no frontend: login guarda token/user/menu em `localStorage`; erros aparecem como mensagens de autenticacao.

#### `ElectionController.php`

Funcao: gere eleicoes, equipa da eleicao, estado, segunda volta e filtros por perfil.

Metodos:

- `__construct(ElectionStatusSyncService $statusSyncService)`: injeta sincronizador automatico de estados.
- `store(Request $request)`: valida dados com `ElectionRequest`, confirma orgao/cargo/delegacao activos, impede conflito de eleicao aberta, cria eleicao programada e adiciona o criador a equipa.
- `update(Request $request, id)`: impede edicao se a eleicao esta em votacao, concluida ou publicada; valida e actualiza.
- `index(Request $request)`: sincroniza estados, lista eleicoes, filtra por perfil. Eleitor so ve eleicoes em que foi autorizado; comissao/fiscal so ve eleicoes da sua equipa.
- `show(Request $request, id)`: mostra uma eleicao respeitando permissao. Para eleitor acrescenta `can_vote`, `has_voted`, `participated`.
- `prepareData(...)`: normaliza datas e define `created_by` e `PROGRAMADA` na criacao.
- `updateStatus(ElectionStatusRequest $request, id)`: altera estado, regista auditoria, notifica publico e emite evento realtime.
- `team(ElectionTeamRequest $request, id)`: define equipa autorizada de uma eleicao programada.
- `updateTeamStatus(ElectionTeamStatusRequest $request, id, userId)`: suspende, remove ou reactiva membro da equipa.
- `secondRound(id)`: replica a eleicao como segunda volta.
- `normalizeLocalDateTime(...)`: converte data do input HTML para `Y-m-d H:i:s`.
- `ensureNoOpenElectionConflict(...)`: impede duplicidade de eleicao aberta para mesmo orgao/cargo/delegacao.
- `validateDependenciesAreActive(...)`: rejeita orgao, cargo ou delegacao inactivos.

Chamado por: `electionService`, `ElectionsPage`, `ElectionCreatePage`, `ElectionDetailsPage`, `ElectionCreateTeamPage`, `ElectionTeamPage`, `ElectionSelectionPage`, `MyElectionsPage`.

Saida esperada: objectos de eleicao com relacoes `organ`, `position`, `delegation`, `creator`, `team`.

#### `VotingController.php`

Funcao: controla o processo de voto do eleitor.

Metodos:

- `elections(Request $request)`: localiza o `Member` associado ao utilizador eleitor e devolve as eleicoes em que ele esta autorizado. Acrescenta flags `can_vote`, `has_voted`, `participated`.
- `ballot(Request $request, id)`: verifica se o eleitor pertence a eleicao e devolve o boletim com candidatos aprovados.
- `confirm(VoteConfirmRequest $request, id)`: valida se a eleicao esta `EM_VOTACAO`, se o candidato e valido ou se e voto em branco, impede voto duplicado, cria `Vote`, marca `ElectionVoter.has_voted`, cria `VoteReceipt`, audita e emite evento de participacao.
- `receipt(VoteReceiptLookupRequest $request, id)`: devolve comprovativo publico do eleitor.
- `memberForUser(Request $request)`: liga `User` ao `Member` por email, telefone ou codigo.

Chamado por: `voteService`, `MyElectionsPage`, `BallotPage`, `VoteSuccessPage`.

Saida esperada: boletim no frontend, depois confirmacao de voto e recibo.

#### `ResultController.php`

Funcao: lista resultados, calcula totais e publica resultados.

Metodos:

- `__construct(NotificationService $notificationService)`: injeta servico de notificacoes.
- `index(Request $request)`: lista eleicoes com estados relevantes. Para eleitor filtra so eleicoes autorizadas; para comissao/fiscal filtra pela equipa.
- `show(Request $request, electionId)`: valida permissao, soma votos online e votos presenciais aprovados, calcula votos brancos e votos por candidato.
- `publish(Request $request, electionId)`: exige eleicao `CONCLUIDA`, impede publicacao com presenciais pendentes, muda estado para `RESULTADOS_PUBLICADOS`, audita, notifica e emite eventos.
- `userCanManageElection(...)`: confirma se utilizador faz parte da equipa autorizada.
- `memberForUser(...)`: localiza membro associado ao eleitor.

Chamado por: `resultService`, `ResultsPage`, `ResultDetailsPage`, `PhysicalResultsPage`.

Saida esperada no frontend: graficos/tabelas de resultados com `total_votes`, `blank_votes`, `online_votes`, `physical_votes`, `candidates`.

#### `PhysicalResultController.php`

Funcao: guarda e aprova resultados presenciais.

Metodos:

- `show(id)`: devolve eleicao e totais presenciais existentes.
- `store(Request $request, id)`: valida totais por candidato/branco, exige eleicao concluida e permissao de gestao; grava como `PENDING`.
- `approve(Request $request, id)`: muda totais presenciais para `APPROVED`.
- `ensureCanManage(...)`: permite admin ou membro da equipa autorizada.
- `ensureElectionIsConcluded(...)`: exige estado `CONCLUIDA`.

Chamado por: `electionService.physicalResults`, `savePhysicalResults`, `approvePhysicalResults`, pagina `PhysicalResultsPage`.

#### `CandidateController.php`

Funcao: gere candidatos de uma eleicao.

Metodos principais:

- `byElection(id)`: devolve candidatos de uma eleicao com dados do membro, cargo e delegacao.
- `index(Request $request)`: lista candidatos, com filtros e permissao por equipa.
- `storeForElection(CandidateRequest $request, id)`: cria candidato para uma eleicao.
- `prepareData(...)`: ajusta dados antes de guardar.
- `prepareCandidateFiles(...)`: processa fotografia/documento quando enviados por `FormData`.
- `updateStatus(CandidateStatusRequest $request, id)`: muda estado do candidato.

Chamado por: `candidateService`, paginas de candidatos, boletim e perfil de candidato.

#### `MemberController.php`

Funcao: gere membros da ADEMO.

Metodos principais:

- `store(Request $request)`: cria membro, gera/usa codigo de membro e pode criar utilizador eleitor associado.
- `update(Request $request, id)`: actualiza membro.
- `prepareData(...)`: normaliza dados antes de guardar.
- `destroy(Request $request, id)`: oculta/inactiva membro.
- `import()`: ponto para importacao em massa.

Chamado por: `memberService`, `MembersPage`, `MemberFormPage`.

#### `UserController.php`

Funcao: gere utilizadores operacionais, como administrador, comissao e fiscal.

Metodos:

- `index(Request $request)`: lista utilizadores com filtros.
- `prepareData(...)`: define senha inicial/default, normaliza role/status/delegacao.
- `store(Request $request)`: cria utilizador e envia dados de acesso por email quando possivel.
- `updateStatus(UserStatusRequest $request, id)`: activa, suspende ou inactiva utilizador.

Chamado por: `userService`, `OperationalUsersPage`, `OperationalUserFormPage`.

#### Outros controllers CRUD

| Ficheiro | Funcao | Metodos especificos | Chamado por |
|---|---|---|---|
| `DelegationController.php` | gerir delegacoes | `update`, `destroy` com regras de negocio | `delegationService` |
| `ProvinceController.php` | listar provincias | `index`, `districts` | `delegationService.provinces/districts` |
| `DistritController.php` | mostrar distrito | herda CRUD | delegacoes |
| `OrganController.php` | gerir orgaos e cargos | `positions`, `storePosition`, `update`, `destroy` | `organService` |
| `PositionController.php` | gerir cargos | `destroy` | `organService.updatePosition/removePosition` |
| `ElectionVoterController.php` | gerir eleitores de eleicao | `byElection`, `storeForElection`, `destroyByMember`, `updateStatus`, `credentials` | `voterService` |
| `ElectionTeamController.php` | controller CRUD de equipa | herda CRUD | usado indirectamente |
| `NotificationController.php` | listar e marcar notificacoes | `index`, `read`, `readAll`, `destroy` | `notificationService` |
| `SettingController.php` | preferencias e senha | `current`, `updateCurrent`, `updateEmail`, `updatePassword` | `settingService`, configuracoes |
| `AuditController.php` | auditoria | `index`, `byElection` e metodos privados de descricao/labels | `auditService`, `AuditPage` |
| `VoteController.php` | CRUD generico de votos | herda CRUD | API interna/potencial |
| `VoteReceiptController.php` | CRUD generico de recibos | herda CRUD | API interna/potencial |

### 2.3 Models

Models representam tabelas e relacoes. Sao chamados pelos controllers e services.

| Ficheiro | Serve para | Metodos/relacoes | Saida esperada |
|---|---|---|---|
| `AuditLog.php` | guardar accoes do sistema | `casts`, `election`, `user` | registo de auditoria |
| `Candidate.php` | candidato de uma eleicao | `getPhotoUrlAttribute`, `getDocumentUrlAttribute`, `publicFileUrl`, `election`, `member`, `position`, `votes` | candidato com foto/documento e relacoes |
| `Delegation.php` | delegacao territorial | `province`, `district`, `users`, `members`, `elections` | delegacao com provincia/distrito |
| `Distrit.php` | distrito | `province`, `delegations` | distrito da provincia |
| `Election.php` | eleicao | `casts`, `serializeDate`, `organ`, `position`, `delegation`, `parentElection`, `creator`, `team`, `candidates`, `voters`, `votes`, `physicalVoteTotals` | eleicao completa |
| `ElectionTeam.php` | equipa gestora da eleicao | `election`, `user` | utilizadores autorizados a gerir |
| `ElectionVoter.php` | eleitor autorizado numa eleicao | `casts`, `election`, `member`, `delegation` | eleitor, estado e voto |
| `Member.php` | membro ADEMO | `casts`, `delegation`, `registrar`, `candidates`, `electionVoters` | dados do membro |
| `Notification.php` | notificacao do utilizador | `casts`, `user`, `election` | notificacao lida/nao lida |
| `Organ.php` | orgao eleitoral | `positions`, `elections` | orgao e cargos |
| `PhysicalVoteTotal.php` | totais presenciais | `casts`, `election`, `candidate` | votos presenciais por candidato/branco |
| `Position.php` | cargo dentro de orgao | `organ`, `elections`, `candidates` | cargo eleitoral |
| `Province.php` | provincia | `districts`, `delegations` | provincia com distritos/delegacoes |
| `Setting.php` | preferencias do utilizador | `casts`, `user` | tema, contraste, notificacoes |
| `User.php` | utilizador autenticavel | `isActive`, `isAdmin`, `isCommission`, `isFiscal`, `isVoter`, `linkedMember`, `delegation`, `createdElections`, `electionTeams`, `notifications`, `setting` | utilizador com permissoes |
| `Vote.php` | voto online | `casts`, `election`, `candidate` | voto anonimo com hash |
| `VoteReceipt.php` | comprovativo de voto | `election` | codigo publico do voto |

### 2.4 Services e Support

| Ficheiro | Funcao | Metodos | Chamado por |
|---|---|---|---|
| `AccessNotificationService.php` | envia email com dados iniciais de acesso | `notifyInitialAccess`, `initialAccessEmailHtml` | `UserController`, `MemberController` quando criam utilizadores |
| `AuditService.php` | grava auditoria sem bloquear operacao principal | `record`, `modelAction`, `system` | quase todos os controllers |
| `ElectionStatusSyncService.php` | actualiza estados por data/hora | `sync` | `ElectionController@index/show`, comando agendado |
| `NotificationService.php` | cria notificacoes e eventos realtime | `notifyUser`, `notifyElectionAudience`, `notifyElectionStatus`, `notifyElectionEndingSoon`, `usersForElection` | estados, resultados, sync |
| `ApiResponse.php` | padroniza JSON | `success`, `error` | controllers |
| `CodeGenerator.php` | gera codigos aleatorios | `make` | criacao de codigos |
| `StatusNormalizer.php` | normaliza estados PT/EN | `normalize` | controllers e filtros |
| `AuthService.php` | vazio actualmente | sem metodos | reservado |
| `CredentialService.php` | vazio actualmente | sem metodos | reservado |
| `ElectionService.php` | vazio actualmente | sem metodos | reservado |
| `ResultService.php` | vazio actualmente | sem metodos | reservado |
| `VotingService.php` | vazio actualmente | sem metodos | reservado |

### 2.5 Requests de validacao

Funcao geral: cada ficheiro em `app/Http/Requests` define regras de validacao. Sao chamados automaticamente nos controllers quando usados como parametro ou manualmente por `CrudController`.

| Ficheiro | Serve para | Metodo principal | Saida |
|---|---|---|---|
| `Auth/LoginRequest.php` | validar login | `prepareForValidation`, `rules` | `access_code`, `password` validados |
| `Auth/UpdateEmailRequest.php` | alterar email | `rules` | email valido |
| `Auth/UpdatePasswordRequest.php` | alterar senha | `rules` | senha actual/nova/confirmacao |
| `Api/ApiFormRequest.php` | base dos requests da API | autorizacao/erros JSON | resposta 422 padronizada |
| `Api/AuditLogRequest.php` | auditoria | `rules` | dados de log |
| `Api/CandidateRequest.php` | candidato | `rules` | membro, cargo, biografia, anexos |
| `Api/CandidateStatusRequest.php` | estado candidato | `rules` | status valido |
| `Api/DelegationRequest.php` | delegacao | `rules` | nome, provincia, distrito, endereco |
| `Api/DistritRequest.php` | distrito | `rules` | provincia, nome, codigo |
| `Api/ElectionRequest.php` | eleicao | `rules` | titulo, orgao, cargo, datas, voto branco |
| `Api/ElectionStatusRequest.php` | estado da eleicao | `rules` | status valido |
| `Api/ElectionTeamRequest.php` | equipa | `rules` | lista de utilizadores e papeis |
| `Api/ElectionTeamResourceRequest.php` | equipa CRUD | `rules` | dados da equipa |
| `Api/ElectionTeamStatusRequest.php` | estado membro da equipa | `rules` | `AUTHORIZED`, `SUSPENDED`, `REMOVED` |
| `Api/ElectionVoterRequest.php` | eleitores autorizados | `rules` | membros seleccionados |
| `Api/ElectionVoterStatusRequest.php` | estado eleitor | `rules` | autorizado/suspenso/removido |
| `Api/MemberRequest.php` | membro | `rules` | nome, email, telefone, BI, delegacao |
| `Api/NotificationRequest.php` | notificacao | `rules` | titulo, mensagem, tipo |
| `Api/OrganRequest.php` | orgao | `rules` | nome, descricao, estado |
| `Api/PositionRequest.php` | cargo | `rules` | orgao, nome, descricao |
| `Api/ProvinceRequest.php` | provincia | `rules` | nome, codigo |
| `Api/SettingRequest.php` | preferencias | `rules` | tema, contraste, notificacoes |
| `Api/UserRequest.php` | utilizador | `rules`, `messages` | nome, email, role, contacto |
| `Api/UserStatusRequest.php` | estado utilizador | `rules` | estado permitido |
| `Api/VoteConfirmRequest.php` | confirmar voto | `rules` | `candidate_id` ou `is_blank` |
| `Api/VoteReceiptLookupRequest.php` | procurar recibo | `rules` | codigo/consulta valida |
| `Api/VoteReceiptRequest.php` | recibo CRUD | `rules` | dados do recibo |
| `Api/VoteRequest.php` | voto CRUD | `rules` | eleicao, candidato, voto branco |

### 2.6 Middleware

| Ficheiro | Funcao | Metodo/saida |
|---|---|---|
| `CheckRole.php` | bloqueia rotas por perfil | deixa passar ou responde 403 |
| `EnsureUserIsActive.php` | bloqueia utilizador inactivo/suspenso | deixa passar ou responde 403/401 |
| `EnsureUtf8Encoding.php` | garante resposta/entrada UTF-8 | melhora compatibilidade JSON |

### 2.7 Events realtime

| Ficheiro | Funcao | Metodos |
|---|---|---|
| `NotificacaoCriada.php` | transmite notificacao criada | `broadcastOn`, `broadcastAs`, `broadcastWith` |
| `EleicaoEstadoActualizado.php` | transmite mudanca de estado | `broadcastOn`, `broadcastAs`, `broadcastWith` |
| `ParticipacaoActualizada.php` | transmite alteracao de participacao/votos | `broadcastOn`, `broadcastAs`, `broadcastWith` |
| `ResultadoPublicado.php` | transmite publicacao de resultado | `broadcastOn`, `broadcastAs`, `broadcastWith` |

Frontend que escuta: `useRealtimeNotifications.js` e `useElectionRealtime.js`.

### 2.8 Console, migrations, seeders e configuracao

- `app/Console/Commands/SyncElectionStatusesCommand.php`: comando para sincronizar estados de eleicoes por data.
- `app/Console/Commands/RepairMojibakeCommand.php`: comando utilitario para corrigir textos com problemas de codificacao.
- `database/migrations/*.php`: criam/alteram tabelas. Cada ficheiro tem `up()` para aplicar e `down()` para reverter.
- `database/seeders/*.php`: inserem dados iniciais. Cada ficheiro tem `run()`.
- `database/factories/UserFactory.php`: gera utilizadores falsos para testes, com `definition()` e `unverified()`.
- `config/*.php`: configuracoes de app, auth, database, cache, filesystems, mail, queue, sanctum, session, broadcasting e reverb.
- `routes/channels.php`: define canais privados/publicos de broadcast.
- `routes/web.php`: rota web inicial.
- `routes/console.php`: comandos simples do Artisan.
- `bootstrap/app.php` e `bootstrap/providers.php`: inicializacao do Laravel e providers.
- `public/index.php`: ponto de entrada HTTP do Laravel.

## 3. Frontend React/Vite

### 3.1 Entrada e rotas

#### `src/main.jsx`

Funcao: arranca a aplicacao React, importa estilos globais e renderiza `App`.

Saida: monta a interface dentro do elemento HTML definido em `index.html`.

#### `src/App.jsx`

Funcao: componente raiz. Normalmente envolve rotas e providers globais.

Metodo:

- `App()`: devolve a estrutura principal.

#### `src/routes/AppRoutes.jsx`

Funcao: define todas as telas e suas permissoes.

Metodos/constantes:

- `ADMIN`, `STAFF`, `MANAGERS`, `COMMISSION`, `EVERYONE`, `VOTER`: listas de roles permitidas.
- `guarded(element, roles)`: envolve uma pagina com `RoleRoute`.
- `AppRoutes()`: cria `BrowserRouter`, rotas publicas de autenticacao e rotas protegidas.

Chamado por: `App.jsx`.

Saida esperada: quando uma URL e aberta, mostra a pagina correcta ou redirecciona para login/dashboard/nao autorizado.

#### `ProtectedRoute.jsx`

Funcao: protege rotas que exigem login.

Saida: mostra o layout protegido se houver token; caso contrario redirecciona para `/login`.

#### `RoleRoute.jsx`

Funcao: protege rotas por perfil.

Saida: mostra a pagina se o role estiver autorizado; caso contrario redirecciona para `/nao-autorizado`.

### 3.2 Comunicacao com API

#### `src/lib/api.js`

Funcao: instancia Axios para todas as chamadas HTTP.

Metodos/partes:

- `api = axios.create(...)`: define `baseURL`, `Accept` e `Content-Type`.
- interceptor de request: le token em `storage.getAuthToken()` e envia `Authorization: Bearer`.
- interceptor de response: se receber 401, limpa sessao e redirecciona para `/login`.

Chamado por: todos os ficheiros em `src/services`.

#### `src/lib/storage.js`

Funcao: gere dados persistidos no `localStorage`.

Metodos:

- `saveAuthData({ token, user, menu })`: guarda token, utilizador e menu.
- `getAuthToken()`: devolve token.
- `getAuthUser()`: devolve user parseado ou limpa se JSON estiver invalido.
- `getAuthMenu()`: devolve menu.
- `clearAuthData()`: remove dados de autenticacao.
- `isAuthenticated()`: confirma se ha token.
- `storage.get/set/remove`: helpers genericos.

Chamado por: login, layouts, rotas protegidas, interceptor da API.

#### `src/lib/echo.js`

Funcao: configura Laravel Echo/Reverb/Pusher para eventos em tempo real.

Saida: exporta `echo`, usado pelos hooks realtime.

### 3.3 Services do frontend

Services sao a camada que chama a API. Quase todos usam `unwrap(response) => response.data?.data`.

| Ficheiro | Metodos | Rotas chamadas | Usado por |
|---|---|---|---|
| `authService.js` | `login`, `logout`, `logoutAll`, `getMe`, `forgotPassword`, `verifyCode`, `resetPassword` | `/auth/...` | paginas de auth, sidebar |
| `auditService.js` | `list` | `GET /audit` | `AuditPage` |
| `candidateService.js` | `list`, `byElection`, `createForElection`, `show`, `update`, `updateStatus` | `/candidates`, `/elections/{id}/candidates` | paginas de candidatos, perfil |
| `delegationService.js` | `list`, `create`, `show`, `update`, `remove`, `provinces`, `districts` | `/delegations`, `/provinces` | delegacoes, membros, utilizadores |
| `electionService.js` | `list`, `show`, `create`, `update`, `saveTeam`, `updateTeamStatus`, `updateStatus`, `publishResults`, `candidates`, `physicalResults`, `savePhysicalResults`, `approvePhysicalResults` | `/elections`, `/results`, `/physical-results` | paginas de eleicoes/resultados |
| `memberService.js` | `list`, `show`, `create`, `update`, `remove` | `/members` | membros, candidatos, eleitores |
| `notificationService.js` | `list`, `markAsRead`, `markAllAsRead`, `remove` | `/notifications` | notificacoes |
| `organService.js` | `list`, `create`, `show`, `update`, `remove`, `addPosition`, `updatePosition`, `removePosition`, `positions` | `/organs`, `/positions` | orgaos/cargos, eleicoes |
| `resultService.js` | `list`, `show`, `publish` | `/results` | resultados |
| `settingService.js` | `updatePassword` | `/settings/password` | configuracoes |
| `userService.js` | `list`, `show`, `create`, `update`, `updateStatus` | `/users` | utilizadores operacionais |
| `voterService.js` | `byElection`, `addToElection`, `removeFromElection`, `updateStatus` | `/elections/{id}/voters` | eleitores de eleicao |
| `voteService.js` | `elections`, `ballot`, `confirm` | `/voting/elections` | portal do eleitor e voto |

### 3.4 Hooks

| Ficheiro | Funcao | Metodos/saida |
|---|---|---|
| `useAuth.js` | devolve user e estado de autenticacao | `useAuth()` retorna dados derivados de `storage` |
| `useDebounce.js` | atrasa actualizacao de valor | `useDebounce(value, delay)` |
| `useElectionRealtime.js` | escuta eventos de resultados/estado | chama callbacks `onResultUpdated`, `onStatusUpdated`, `onAnyUpdate` |
| `useRealtimeNotifications.js` | escuta notificacoes, resultados e estados | chama `onNotification` e `onRefresh` |
| `usePermissions.js` | actualmente permissao basica | `can()` retorna falso por defeito |

### 3.5 Paginas do frontend

| Ficheiro | Funcao da tela | Chamadas principais | Saida esperada |
|---|---|---|---|
| `pages/auth/LoginPage.jsx` | login | `authService.login`, `saveAuthData` | entra no sistema e redirecciona |
| `ForgotPasswordPage.jsx` | pedir codigo | `forgotPassword` | email/codigo enviado |
| `VerifyCodePage.jsx` | validar codigo | `verifyCode` | avanca para nova senha |
| `ResetPasswordPage.jsx` | redefinir senha | `resetPassword` | senha actualizada |
| `DashboardPage.jsx` | painel inicial | services de listagem | indicadores/resumo |
| `DelegationsPage.jsx` | lista delegacoes | `delegationService.list/remove` | tabela com filtros e accoes |
| `DelegationFormPage.jsx` | cria/edita delegacao | `show/create/update`, `provinces`, `districts` | formulario gravado |
| `OrgansPage.jsx` | lista orgaos/cargos | `organService.list/remove` | orgaos e cargos |
| `OrganFormPage.jsx` | cria/edita orgao e cargos | `create/update/addPosition/updatePosition` | orgao actualizado |
| `MembersPage.jsx` | lista membros | `memberService.list/remove` | membros filtrados |
| `MemberFormPage.jsx` | cria/edita membro | `memberService.show/create/update`, `delegationService.list` | membro gravado |
| `OperationalUsersPage.jsx` | administra comissao/fiscal | `userService.list/updateStatus`, filtros | utilizadores activos/suspensos |
| `OperationalUserFormPage.jsx` | cria/edita utilizador | `userService.show/create/update`, `delegationService.list` | utilizador gravado |
| `ElectionsPage.jsx` | lista eleicoes | `electionService.list`, `delegationService.list` | eleicoes por perfil |
| `ElectionCreatePage.jsx` | cria/edita eleicao | `electionService.create/update`, `organService`, `delegationService` | eleicao programada |
| `ElectionDetailsPage.jsx` | detalhes da eleicao | `electionService.show/updateStatus` | estado, candidatos, equipa |
| `ElectionCreateTeamPage.jsx` | define equipa | `electionService.saveTeam`, `userService.list` | equipa autorizada |
| `ElectionTeamPage.jsx` | gere equipa | `electionService.list/updateTeamStatus` | membros da equipa |
| `ElectionCandidatesPage.jsx` | lista candidatos | `candidateService.list/updateStatus` | candidatos filtrados |
| `ElectionCandidateFormPage.jsx` | cria/edita candidato | `candidateService`, `memberService`, `electionService` | candidato com anexos |
| `ElectionVotersPage.jsx` | lista eleitores autorizados | `voterService.byElection/updateStatus/remove` | eleitores por eleicao |
| `ElectionVoterFormPage.jsx` | adiciona eleitores | `voterService.addToElection`, `memberService.list`, `electionService.list` | membros autorizados |
| `PhysicalResultsPage.jsx` | resultados presenciais | `physicalResults`, `savePhysicalResults`, `approvePhysicalResults`, `publishResults` | totais guardados/aprovados/publicados |
| `MyElectionsPage.jsx` | portal do eleitor | `voteService.elections` | eleicoes para votar |
| `BallotPage.jsx` | boletim de voto | `voteService.ballot/confirm` | voto confirmado e recibo |
| `CandidateProfilePage.jsx` | perfil do candidato | `candidateService.show` | foto, documento, biografia |
| `VoteSuccessPage.jsx` | sucesso do voto | dados de navegacao/session | mensagem de sucesso |
| `VoteConfirmPage.jsx` | confirmacao alternativa | componente de confirmacao | confirma escolha |
| `ResultsPage.jsx` | lista resultados | `resultService.list` | eleicoes/resultados |
| `ResultDetailsPage.jsx` | detalhes do resultado | `resultService.show/publish` | grafico/tabela de apuramento |
| `ElectionSelectionPage.jsx` | seleccionar eleicao para resultado/auditoria | `electionService.list`, filtros | navega para destino correcto |
| `AuditPage.jsx` | auditoria | `auditService.list` | historico de accoes |
| `NotificationsPage.jsx` | notificacoes | `notificationService.list/read/remove` | notificacoes do eleitor |
| `SettingsPage.jsx` | configuracoes | `settingService.updatePassword`, localStorage | altera senha/preferencias |
| `UnauthorizedPage.jsx` | acesso negado | sem API | aviso de permissao |

### 3.6 Componentes

| Pasta/Ficheiro | Funcao |
|---|---|
| `components/layout/AuthLayout.jsx` | layout das telas publicas de login/recuperacao |
| `AppLayout.jsx` | layout autenticado com header/sidebar/conteudo |
| `AppHeader.jsx`, `Header.jsx` | cabecalhos |
| `Sidebar.jsx` | menu lateral, filtra itens por role e faz logout |
| `PageHeader.jsx` | titulo/descricao/accoes de pagina |
| `ThemeSelector.jsx` | alterna tema claro/escuro |
| `components/common/Button.jsx` | botao reutilizavel |
| `Card.jsx` | card visual |
| `Badge.jsx` | etiqueta de estado |
| `Input.jsx`, `Textarea.jsx`, `Select.jsx`, `RequiredLabel.jsx`, `FormError.jsx` | campos de formulario |
| `Table.jsx`, `SimpleTable.jsx` | tabelas |
| `Pagination.jsx`, `PaginationLayout.jsx`, `ManagementPagination.jsx` | paginacao |
| `Modal.jsx` | janela modal |
| `Loading.jsx` | indicador de carregamento |
| `EmptyState.jsx` | estado vazio |
| `FeedbackCard.jsx` | feedback/alerta |
| `SearchInput.jsx` | pesquisa |
| `RowActions.jsx`, `ActionButtons.jsx` | botoes de editar, activar, suspender, remover |
| `components/forms/CandidateForm.jsx` | formulario reutilizavel de candidato |
| `DelegationForm.jsx` | formulario de delegacao |
| `ElectionForm.jsx` | formulario de eleicao |
| `MemberForm.jsx` | formulario de membro |
| `UserForm.jsx` | formulario de utilizador |
| `components/election/AuditTimeline.jsx` | linha temporal de auditoria |
| `CandidateCard.jsx` | cartao de candidato |
| `ElectionStatusBadge.jsx` | estado da eleicao |
| `ResultChart.jsx` | grafico de resultados |
| `VotingCard.jsx` | cartao de eleicao/votacao |
| `components/voting/VoteConfirmModal.jsx` | modal final antes de confirmar voto |

### 3.7 Utils, constants e config

| Ficheiro | Funcao | Metodos/valores |
|---|---|---|
| `utils/apiError.js` | traduz erros da API | `getApiErrorMessage` |
| `utils/auditLabels.js` | labels de auditoria | `auditActionLabels`, `getAuditActionLabel` |
| `utils/cn.js` | junta classes CSS | `cn` |
| `utils/date.js` | formata data simples | `formatDate` |
| `utils/exportFile.js` | exporta CSV | `exportCsv` |
| `utils/localDateTime.js` | converte datas de input/API | `toInputDateTime`, `getCurrentMinDateTime`, `toApiDateTime`, `isBeforeNow`, `isSameOrBefore`, `formatDateTime` |
| `utils/notify.js` | toasts | `success`, `error`, `warning`, `info` |
| `utils/permissions.js` | permissoes de menu/role | `hasPermission`, `canAccessRole`, `filterMenuByRole` |
| `utils/rolePermissions.js` | permissoes por recurso | `canManageResource`, `canCreateResource`, `canMutateStatus`, `shouldShowActions` |
| `utils/statusFilters.js` | normalizacao de estados | `normalizeStatus`, `commonStatusLabel`, `onlyActive`, `onlyVisible`, etc. |
| `utils/validators.js` | validacoes simples | `isRequired` |
| `constants/routes.js` | nomes/paths de rotas | `ROUTES` |
| `constants/roles.js` | roles e aliases | `normalizeRole`, `roleMatches`, `getRoleLabel` |
| `constants/query-keys.js` | chaves de cache | `QUERY_KEYS` |
| `constants/election-status.js` | estados de eleicao | `ELECTION_STATUS` |
| `config/menu.js` | itens do menu lateral | `menuItems`, `menu` |
| `config/app.js` | config da app | `appConfig` |
| `config/colors.js` | paleta | `colors` |
| `config/permissions.js` | permissoes futuras | `permissionsConfig` |
| `data/elections.js` | dados/labels auxiliares | `getElectionStatusLabel`, `getElectionStatusClass`, `getElectionById` |

### 3.8 Estilos e assets

| Ficheiro | Funcao |
|---|---|
| `src/index.css` | estilos base globais |
| `src/App.css` | estilos principais da aplicacao |
| `src/styles/globals.css` | estilos globais adicionais |
| `src/styles/accessibility-tailwind.css` | estilos de acessibilidade/contraste |
| `src/assets/logos/logo_ademo.png` | logotipo ADEMO |
| `src/assets/hero.png` | imagem usada em telas visuais |
| `public/favicon.png` | icone do navegador |
| `public/icons.svg` | simbolos/icones publicos |

## 4. Fluxos principais explicados

### 4.1 Login

1. `LoginPage.jsx` recolhe codigo de acesso e senha.
2. Chama `authService.login(payload)`.
3. `authService` faz `POST /auth/login`.
4. `routes/api.php` envia para `AuthController@login`.
5. Backend valida `LoginRequest`, procura `User`, confere senha e estado.
6. Backend devolve `token`, `user`, `menu`, `redirect_to`.
7. Frontend guarda em `storage.saveAuthData`.
8. Utilizador e redireccionado para `/dashboard` ou `/portal-eleitor/votacoes`.

### 4.2 Criar eleicao

1. `ElectionCreatePage.jsx` carrega orgaos, cargos e delegacoes.
2. Ao submeter, chama `electionService.create(payload)`.
3. API recebe `POST /elections`.
4. `ElectionController@store` valida `ElectionRequest`.
5. Confirma se orgao/cargo/delegacao estao activos.
6. Confirma se nao existe eleicao aberta igual.
7. Cria `Election` com `status = PROGRAMADA`.
8. Adiciona o criador a `ElectionTeam`.
9. Devolve eleicao criada para o frontend.

### 4.3 Autorizar eleitores

1. `ElectionVoterFormPage.jsx` lista membros e eleicoes programadas.
2. Utilizador selecciona membros.
3. Chama `voterService.addToElection(electionId, payload)`.
4. API chama `ElectionVoterController@storeForElection`.
5. Backend cria/actualiza registos `ElectionVoter` com `AUTHORIZED`.
6. Frontend actualiza tabela de eleitores autorizados.

### 4.4 Votar

1. `MyElectionsPage.jsx` chama `voteService.elections()`.
2. Backend devolve apenas eleicoes autorizadas ao eleitor.
3. Ao entrar numa eleicao, `BallotPage.jsx` chama `voteService.ballot(id)`.
4. Backend valida autorizacao e devolve candidatos aprovados.
5. Eleitor escolhe candidato ou voto branco.
6. `BallotPage.jsx` chama `voteService.confirm(id, payload)`.
7. `VotingController@confirm` valida estado `EM_VOTACAO`, impede voto duplicado, grava `Vote`, marca `has_voted`, cria `VoteReceipt`.
8. Frontend mostra sucesso.

### 4.5 Resultados

1. `ResultsPage.jsx` chama `resultService.list()`.
2. Ao abrir detalhe, `ResultDetailsPage.jsx` chama `resultService.show(electionId)`.
3. `ResultController@show` soma:
   - votos online em `votes`;
   - votos presenciais aprovados em `physical_vote_totals`;
   - votos brancos online e presenciais;
   - votos por candidato.
4. Frontend mostra totais, percentagens/grafico e candidatos.

### 4.6 Publicar resultados

1. A comissao/admin conclui a eleicao.
2. Se houver voto presencial, `PhysicalResultsPage.jsx` guarda e aprova totais.
3. Frontend chama `resultService.publish` ou `electionService.publishResults`.
4. `ResultController@publish` exige eleicao `CONCLUIDA` e sem presenciais pendentes.
5. Estado muda para `RESULTADOS_PUBLICADOS`.
6. `NotificationService` notifica participantes.
7. Eventos realtime actualizam telas abertas.

## 5. Observacoes importantes

- O backend contem alguns textos com caracteres codificados de forma incorrecta, por exemplo `EleiÃ§Ã£o`. Existe um comando `RepairMojibakeCommand.php` que parece destinado a corrigir este problema.
- Alguns services backend estao vazios (`AuthService`, `ElectionService`, `ResultService`, `VotingService`, `CredentialService`). Actualmente a regra de negocio esta maioritariamente dentro dos controllers.
- O frontend usa tanto roles em portugues como ingles: `COMISSAO/COMMISSION` e `ELEITOR/VOTER`. A normalizacao esta em `constants/roles.js` e utilitarios de permissao.
- A resposta paginada do Laravel normalmente vem em `data.data`; por isso os services usam `payload?.data ?? payload ?? []`.
- A seguranca principal depende de Sanctum, middleware `active` e middleware `role`.

