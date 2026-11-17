# Documento Técnico do Backend — Sistema de Votação Eleitoral da ADEMO

**Projecto:** Sistema de Votação Eleitoral da ADEMO  
**Tipo:** Backend API REST  
**Backend:** Laravel 13  
**PHP:** 8.4  
**Base de Dados:** PostgreSQL  
**Frontend:** React JavaScript + Vite  
**Formato:** Markdown (`.md`)  
**Versão:** 2.1  
**Estado:** Actualizado com `province`, `distrit`, delegações por IDs, segunda volta, permissões e integração com React  
**Linguagem:** Português pré-Acordo  

---

## 1. Objectivo deste Documento

Este documento consolida a estrutura técnica do backend do Sistema de Votação Eleitoral da ADEMO, incluindo autenticação, perfis de acesso, páginas visíveis por perfil, acções permitidas, entidades da base de dados, relações, endpoints da API, regras de segurança, ligação com o frontend React e ordem recomendada de desenvolvimento.

Esta versão actualiza o documento anterior com as alterações mais recentes da base de dados, especialmente a criação das tabelas `province` e `distrit`, a alteração da tabela `delegations` para usar `province_id` e `district_id`, a introdução de segunda volta em caso de empate e a clarificação das permissões por perfil.

---

## 2. Decisões Técnicas Confirmadas

| Área | Decisão |
|---|---|
| Backend | Laravel 13 |
| PHP | PHP 8.4 |
| Base de dados | PostgreSQL |
| Frontend | React JavaScript com Vite |
| API | REST JSON |
| Autenticação | Código de acesso + palavra-passe |
| Sessão/API | Laravel Sanctum |
| Resultados | Publicação automática |
| Empate | Segunda volta |
| Comissão | Pode gerir membros |
| Candidaturas | Candidatos registados pela Comissão, sem candidatura pública no MVP |
| Províncias | Geridas pela tabela `province` |
| Distritos | Geridos pela tabela `distrit` |
| Delegações | Ligadas a `province` e `distrit` por chaves estrangeiras |
| Notificações para Administrador, Comissão e Fiscal | `Won't` no MVP |
| Notificações para Eleitor | `Should` |
| Voto | Secreto, único e irreversível após confirmação |
| Auditoria | Deve registar acções críticas, mas nunca revelar a escolha do eleitor |
| Realtime | Pode ser futuro com Laravel Reverb; no MVP pode começar com polling |

> Observação: a tabela está actualmente definida como `distrit`. Por coerência com o schema já criado, o backend deve respeitar este nome. Se futuramente quiserem corrigir para `districts`, isso deve ser feito através de uma migration própria e com cuidado para não quebrar relações.

---

## 3. Visão Geral do Backend

O backend será responsável por:

- Autenticar utilizadores;
- Controlar perfis e permissões;
- Gerir províncias;
- Gerir distritos por província;
- Gerir delegações da ADEMO associadas a província e distrito;
- Gerir órgãos sociais e cargos;
- Gerir membros da ADEMO;
- Gerir utilizadores operacionais, como Comissão e Fiscal;
- Criar e configurar eleições;
- Seleccionar eleitores autorizados;
- Registar candidatos;
- Permitir votação segura;
- Impedir voto duplicado;
- Gerar comprovativo de participação;
- Apurar e publicar resultados automaticamente;
- Detectar empate e preparar segunda volta;
- Registar auditoria;
- Fornecer dados ao frontend React por API REST.

---

## 4. Arquitectura Recomendada

A aplicação deve seguir uma arquitectura em camadas.

```txt
[React JavaScript - Frontend]
        ↓ HTTP/JSON
[Laravel API - Controllers]
        ↓
[Form Requests - Validação]
        ↓
[Services - Regras de Negócio]
        ↓
[Models/Eloquent - Relações]
        ↓
[PostgreSQL - Persistência]
        ↓
[Audit Logs / Notifications / Events]
```

| Camada | Responsabilidade |
|---|---|
| Controllers | Receber requisições HTTP, chamar services e devolver JSON |
| Form Requests | Validar dados de entrada |
| Services | Concentrar regras de negócio |
| Models | Representar tabelas e relações |
| Policies/Middlewares | Controlar permissões |
| Events/Notifications | Suportar notificações e realtime futuro |
| Audit Logs | Registar acções críticas |
| PostgreSQL | Guardar dados relacionais com integridade |

---

## 5. Perfis do Sistema

| Perfil | Código | Descrição |
|---|---|---|
| Administrador | `ADMIN` | Gere estrutura base, membros, utilizadores, consulta eleições, resultados e auditoria |
| Comissão Eleitoral | `COMMISSION` | Gere membros, cria eleições, define equipa, selecciona eleitores, regista candidatos e acompanha eleições |
| Fiscal | `FISCAL` | Consulta eleições, candidatos, eleitores autorizados, resultados e auditoria |
| Eleitor | `VOTER` | Consulta eleições, vota quando autorizado e consulta resultados publicados |

> O perfil `DELEGATION_ADMIN` pode ser considerado futuramente, mas não é obrigatório no MVP actual.

---

## 6. Regras Gerais de Autenticação

### 6.1. Login

A autenticação deve ser feita com:

- Código de acesso;
- Palavra-passe.

O login não deve depender obrigatoriamente de e-mail, porque alguns utilizadores podem não ter e-mail activo ou podem ter dificuldade em utilizá-lo.

### 6.2. Campos da Tela de Login

| Campo/Elemento | Obrigatório | Observação |
|---|---|---|
| Código de acesso | Sim | Ex.: `ADM-0001`, `COM-0001`, `FIS-0001`, `ELT-0001` |
| Palavra-passe | Sim | Deve ser validada pelo backend |
| Botão Entrar | Sim | Deve mostrar estado de carregamento |
| Link Esqueci a senha | Sim | Recuperação por e-mail quando existir e-mail associado |
| Mensagem de erro | Sim | Não deve revelar se o código ou a senha está errado separadamente |

### 6.3. Resposta Esperada no Login

```json
{
  "success": true,
  "message": "Autenticação realizada com sucesso.",
  "data": {
    "token": "TOKEN_SANCTUM",
    "user": {
      "id": 1,
      "name": "Nome do Utilizador",
      "access_code": "ADM-0001",
      "email": "utilizador@ademo.org.mz",
      "role": "ADMIN",
      "status": "ACTIVE",
      "delegation_id": null,
      "last_login_at": "2026-05-15T10:00:00Z"
    }
  }
}
```

### 6.4. Regras Obrigatórias

- Utilizador inactivo não entra;
- Utilizador bloqueado não entra;
- Código de acesso deve ser único;
- Palavra-passe deve ser guardada com hash;
- O backend deve validar permissões em todas as rotas;
- O frontend pode ocultar botões, mas nunca deve ser a única camada de segurança;
- Comissão, Fiscal e Administrador não votam no MVP, salvo decisão formal futura.

---

## 7. Redireccionamento Após Login

| Perfil | Rota inicial no frontend |
|---|---|
| `ADMIN` | `/dashboard` |
| `COMMISSION` | `/dashboard` |
| `FISCAL` | `/dashboard` |
| `VOTER` | `/eleicoes` |

> A mesma rota `/dashboard` pode apresentar conteúdos diferentes conforme o perfil.

---

## 8. Páginas Visíveis por Perfil

### 8.1. Administrador

| Página | Visível | Acções principais |
|---|---|---|
| Painel Inicial | Sim | Ver resumo geral |
| Províncias | Sim | Consultar |
| Distritos | Sim | Consultar por província |
| Delegações | Sim | Registar, consultar, editar, inactivar |
| Órgãos e Cargos | Sim | Registar, consultar, editar, inactivar |
| Membros | Sim | Registar, consultar, editar, inactivar |
| Comissão e Fiscal | Sim | Registar, consultar, editar, inactivar utilizadores operacionais |
| Eleições | Sim | Consultar e supervisionar |
| Candidatos | Sim | Consultar e supervisionar |
| Eleitores Autorizados | Sim | Consultar e supervisionar |
| Resultados | Sim | Consultar resultados |
| Auditoria | Sim | Consultar auditoria geral |
| Notificações | Não no MVP | `Won't` |
| Configurações | Sim | Alterar dados da conta, senha, e-mail, tema e acessibilidade |

### 8.2. Comissão Eleitoral

| Página | Visível | Acções principais |
|---|---|---|
| Painel Inicial | Sim | Ver resumo das eleições sob gestão |
| Províncias | Sim | Consultar |
| Distritos | Sim | Consultar por província |
| Delegações | Sim | Consultar |
| Membros | Sim | Registar, consultar, editar, inactivar e seleccionar |
| Eleições | Sim | Criar, editar e acompanhar |
| Definir Equipa | Sim | Associar Comissão e Fiscais |
| Candidatos | Sim | Registar, consultar, editar, validar, desqualificar |
| Eleitores Autorizados | Sim | Seleccionar, remover antes do início, consultar |
| Acompanhar Votação | Sim | Ver participação e estado da eleição |
| Resultados | Sim | Consultar resultados publicados automaticamente |
| Auditoria da Eleição | Limitado | Consultar acções das eleições sob gestão |
| Notificações | Não no MVP | `Won't` |
| Configurações | Sim | Alterar dados da conta, senha, e-mail, tema e acessibilidade |

### 8.3. Fiscal

| Página | Visível | Acções principais |
|---|---|---|
| Painel Inicial | Sim | Ver eleições fiscalizadas |
| Províncias | Sim | Consultar |
| Distritos | Sim | Consultar por província |
| Delegações | Sim | Consultar |
| Eleições | Sim | Consultar |
| Candidatos | Sim | Consultar |
| Eleitores Autorizados | Sim | Consultar sem ver voto |
| Participação | Sim | Consultar participação |
| Resultados | Sim | Consultar |
| Auditoria | Sim | Consultar eventos críticos |
| Notificações | Não no MVP | `Won't` |
| Configurações | Sim | Alterar dados da conta, senha, e-mail, tema e acessibilidade |

### 8.4. Eleitor

| Página | Visível | Acções principais |
|---|---|---|
| Eleições | Sim | Ver eleições disponíveis e estado de autorização |
| Detalhes da Eleição | Sim | Ver órgão, cargo, período, regras e candidatos |
| Boletim de Voto | Sim, se autorizado | Seleccionar candidato ou voto em branco |
| Perfil do Candidato | Sim | Consultar informações do candidato |
| Confirmação do Voto | Sim | Rever e confirmar voto |
| Voto Registado | Sim | Ver comprovativo sem revelar escolha |
| Resultados | Sim | Consultar resultados publicados |
| Notificações | Sim | Receber aviso de início, encerramento e publicação de resultados |
| Configurações | Sim | Alterar dados da conta, senha, e-mail, tema e acessibilidade |

---

## 9. Menus da Sidebar por Perfil

### 9.1. Administrador

1. Painel Inicial
2. Delegações
3. Órgãos e Cargos
4. Membros
5. Comissão e Fiscal
6. Eleições
7. Candidatos
8. Eleitores
9. Resultados
10. Auditoria
11. Configurações
12. Sair

### 9.2. Comissão Eleitoral

1. Painel Inicial
2. Membros
3. Eleições
4. Candidatos
5. Eleitores
6. Acompanhar Votação
7. Resultados
8. Auditoria da Eleição
9. Configurações
10. Sair

### 9.3. Fiscal

1. Painel Inicial
2. Eleições
3. Candidatos
4. Eleitores
5. Participação
6. Resultados
7. Auditoria
8. Configurações
9. Sair

### 9.4. Eleitor

1. Eleições
2. Resultados
3. Notificações
4. Configurações
5. Sair

---

## 10. Matriz de Permissões Inicial

| Funcionalidade | Administrador | Comissão Eleitoral | Fiscal | Eleitor |
|---|---|---|---|---|
| Painel geral | Sim | Sim | Consulta | Não |
| Províncias | Consultar | Consultar | Consultar | Não |
| Distritos | Consultar | Consultar | Consultar | Não |
| Delegações | Gerir | Consultar | Consultar | Não |
| Órgãos e cargos | Gerir | Consultar | Consultar | Não |
| Membros | Gerir | Gerir | Consultar | Não |
| Comissão e Fiscal | Gerir | Consultar equipa | Consultar equipa | Não |
| Criar eleição | Não | Sim | Não | Não |
| Candidatos | Gerir/Supervisionar | Gerir | Consultar | Consultar no boletim |
| Eleitores da eleição | Gerir/Supervisionar | Gerir | Consultar | Não |
| Votar | Não | Não | Não | Sim |
| Resultados | Sim | Sim | Sim | Sim, quando publicados |
| Auditoria | Sim | Limitado | Sim | Não |
| Notificações | Won't | Won't | Won't | Should |
| Configurações da conta | Sim | Sim | Sim | Sim |

---

## 11. Prioridade das Funcionalidades por Perfil

| Funcionalidade | Prioridade |
|---|---|
| Autenticação | Must |
| Gestão de províncias e distritos | Must |
| Gestão de delegações | Must |
| Gestão de membros | Must |
| Gestão de órgãos e cargos | Must |
| Gestão de Comissão e Fiscal | Must |
| Criação de eleição | Must |
| Selecção de eleitores | Must |
| Registo de candidatos | Must |
| Votação | Must |
| Impedir voto duplicado | Must |
| Voto secreto | Must |
| Resultados automáticos | Must |
| Segunda volta em caso de empate | Should |
| Auditoria | Must |
| Configurações de conta | Should |
| Notificações para eleitor | Should |
| Notificações para Admin/Comissão/Fiscal | Won't no MVP |
| Exportação de relatórios | Could |
| Importação de membros | Could |
| Realtime com WebSocket | Could |

---

## 12. Estados Principais do Sistema

### 12.1. Estado do Utilizador

| Estado | Significado |
|---|---|
| `ACTIVE` | Pode aceder ao sistema |
| `INACTIVE` | Não pode aceder |
| `BLOCKED` | Conta bloqueada por segurança |

### 12.2. Estado da Eleição

| Estado | Significado |
|---|---|
| `DRAFT` | Rascunho |
| `SCHEDULED` | Programada |
| `ACTIVE` | A decorrer |
| `CLOSED` | Encerrada |
| `RESULTS_PUBLISHED` | Resultados publicados |
| `SECOND_ROUND_REQUIRED` | Segunda volta necessária |
| `CANCELLED` | Cancelada |
| `ARCHIVED` | Arquivada |

### 12.3. Estado do Candidato

| Estado | Significado |
|---|---|
| `PENDING` | Pendente |
| `VALIDATED` | Validado |
| `DISQUALIFIED` | Desqualificado |
| `WITHDRAWN` | Desistiu |
| `INACTIVE` | Inactivo |

### 12.4. Estado do Eleitor na Eleição

| Estado | Significado |
|---|---|
| `AUTHORIZED` | Autorizado a votar |
| `NOT_AUTHORIZED` | Não autorizado |
| `VOTED` | Já votou |
| `REMOVED` | Removido da lista de eleitores |

---

## 13. Regras de Visibilidade de Eleições

### 13.1. Administrador

O Administrador pode consultar todas as eleições, independentemente do estado.

### 13.2. Comissão

A Comissão visualiza:

- Eleições criadas por si;
- Eleições em que está associada à equipa;
- Eleições que gere operacionalmente.

### 13.3. Fiscal

O Fiscal visualiza:

- Eleições em que está associado como fiscal;
- Candidatos e eleitores autorizados dessas eleições;
- Resultados e auditoria dessas eleições.

### 13.4. Eleitor

O Eleitor visualiza:

- Eleições em que está autorizado a votar;
- Eleições disponíveis para consulta de estado;
- Resultados publicados.

User Story recomendada:

> Como Eleitor, quero visualizar eleições disponíveis e o meu estado de autorização, para saber se posso participar ou apenas consultar informações.

---

## 14. Regras de Votação

| Regra | Descrição |
|---|---|
| Voto único | O eleitor só pode votar uma vez na mesma eleição/cargo |
| Voto secreto | O voto não deve guardar ligação directa entre eleitor e candidato |
| Confirmação obrigatória | O voto só é submetido depois da confirmação final |
| Irreversibilidade | O voto não pode ser alterado depois da submissão |
| Período válido | Só se vota durante o período activo da eleição |
| Eleitor autorizado | Apenas eleitor autorizado pode abrir boletim de voto |
| Voto em branco | Permitido quando configurado para a eleição |
| Comprovativo | Confirma participação sem revelar o candidato escolhido |
| Perfis operacionais | Admin, Comissão e Fiscal não votam no MVP |
| Empate | Em caso de empate, deve existir segunda volta |

---

## 15. Regras de Resultados

- Os resultados devem ser publicados automaticamente após o encerramento da eleição.
- O sistema deve calcular votos por candidato.
- O sistema deve calcular votos em branco.
- O sistema deve calcular percentagens.
- O sistema deve indicar total de eleitores autorizados.
- O sistema deve indicar total de votantes.
- O sistema deve indicar abstenção.
- O sistema deve detectar empate.
- Havendo empate, o sistema deve marcar a eleição como `SECOND_ROUND_REQUIRED`.
- A segunda volta deve ser criada com base nos candidatos empatados.
- O eleitor só vê resultados publicados.
- A auditoria nunca deve revelar o voto individual.

---

## 16. Regras de Empate e Segunda Volta

### 16.1. Quando há empate?

Há empate quando dois ou mais candidatos terminam com a mesma quantidade de votos no primeiro lugar.

### 16.2. O que o sistema deve fazer?

1. Apurar os resultados;
2. Detectar empate;
3. Marcar a eleição como `SECOND_ROUND_REQUIRED`;
4. Identificar os candidatos empatados;
5. Permitir criar segunda volta;
6. Associar apenas os candidatos empatados à segunda volta;
7. Manter os eleitores autorizados ou permitir nova selecção, conforme decisão da Comissão;
8. Registar tudo em auditoria.

### 16.3. Como modelar a segunda volta?

Usar a própria tabela `elections` com os campos:

- `parent_election_id`;
- `round_number`.

```txt
Eleição original
    ↓
Segunda volta vinculada pela coluna parent_election_id
```

---

## 17. Estrutura Recomendada do Backend Laravel

```txt
ademo-eleitoral-backend/
├── app/
│   ├── Enums/
│   ├── Events/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   ├── Policies/
│   ├── Services/
│   └── Support/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   ├── api.php
│   ├── channels.php
│   └── web.php
├── tests/
│   ├── Feature/
│   └── Unit/
├── .env
└── composer.json
```

---

## 18. Estrutura Detalhada por Pasta

| Pasta | Finalidade |
|---|---|
| `app/Enums` | Estados, perfis e categorias |
| `app/Events` | Eventos para realtime futuro |
| `app/Http/Controllers/Api` | Controllers REST |
| `app/Http/Requests` | Validações de entrada |
| `app/Http/Middleware` | Middlewares de autenticação e perfil |
| `app/Models` | Models Eloquent |
| `app/Policies` | Regras de autorização |
| `app/Services` | Regras de negócio |
| `app/Support` | Classes auxiliares |
| `database/migrations` | Estrutura das tabelas |
| `database/seeders` | Dados iniciais |
| `routes/api.php` | Endpoints REST |
| `routes/channels.php` | Canais privados para realtime futuro |
| `tests` | Testes unitários e de API |

---

## 19. Pacotes Recomendados

| Pacote | Finalidade | Prioridade |
|---|---|---|
| Laravel Sanctum | Autenticação API | Must |
| Laravel Pint | Formatação de código | Should |
| Scribe | Documentação da API | Should |
| Laravel Reverb | Realtime futuro | Could |
| Spatie Permission | Permissões avançadas | Could |

### 19.1. Instalação

```bash
composer require laravel/sanctum
composer require laravel/pint --dev
composer require knuckleswtf/scribe --dev
```

Realtime futuro:

```bash
php artisan install:broadcasting
```

Spatie Permission, caso seja necessário:

```bash
composer require spatie/laravel-permission
```

---

## 20. Configuração `.env` Recomendada

```env
APP_NAME="Sistema Eleitoral ADEMO"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ademo_eleitoral
DB_USERNAME=postgres
DB_PASSWORD=SUA_SENHA

SESSION_DRIVER=database
QUEUE_CONNECTION=database

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
```

Realtime futuro:

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
```

---

## 21. Models Principais

```bash
php artisan make:model Province -m
php artisan make:model Distrit -m
php artisan make:model Delegation -m
php artisan make:model Organ -m
php artisan make:model Position -m
php artisan make:model Member -m
php artisan make:model Election -m
php artisan make:model ElectionTeam -m
php artisan make:model Candidate -m
php artisan make:model ElectionVoter -m
php artisan make:model Vote -m
php artisan make:model VoteReceipt -m
php artisan make:model AuditLog -m
php artisan make:model Setting -m
php artisan make:model Notification -m
```

---

## 22. Controllers Principais

```bash
php artisan make:controller Api/AuthController
php artisan make:controller Api/ProvinceController --api
php artisan make:controller Api/DistritController --api
php artisan make:controller Api/DelegationController --api
php artisan make:controller Api/OrganController --api
php artisan make:controller Api/PositionController --api
php artisan make:controller Api/MemberController --api
php artisan make:controller Api/UserController --api
php artisan make:controller Api/ElectionController --api
php artisan make:controller Api/CandidateController --api
php artisan make:controller Api/ElectionVoterController --api
php artisan make:controller Api/VotingController
php artisan make:controller Api/ResultController
php artisan make:controller Api/AuditController
php artisan make:controller Api/NotificationController
php artisan make:controller Api/SettingController
```

---

## 23. Services Principais

| Service | Responsabilidade |
|---|---|
| `AccessNotificationService` | Credenciais iniciais e envio por email |
| `VotingService` | Votação, sigilo e bloqueio de duplicidade |
| `AuditService` | Registo de acções críticas |
| `ElectionStatusSyncService` | Sincroniza estados por data/hora |
| `NotificationService` | Notificações e eventos em tempo real |

---

## 24. Form Requests

```bash
php artisan make:request LoginRequest
php artisan make:request ForgotPasswordRequest
php artisan make:request VerifyCodeRequest
php artisan make:request ResetPasswordRequest
php artisan make:request StoreDelegationRequest
php artisan make:request StoreOrganRequest
php artisan make:request StorePositionRequest
php artisan make:request StoreMemberRequest
php artisan make:request StoreUserRequest
php artisan make:request StoreElectionRequest
php artisan make:request StoreCandidateRequest
php artisan make:request StoreElectionVoterRequest
php artisan make:request ConfirmVoteRequest
php artisan make:request UpdateSettingsRequest
php artisan make:request ChangePasswordRequest
```

---

## 25. Enums Recomendados

### 25.1. `UserRole.php`

```php
<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'ADMIN';
    case COMMISSION = 'COMMISSION';
    case FISCAL = 'FISCAL';
    case VOTER = 'VOTER';
}
```

### 25.2. `UserStatus.php`

```php
<?php

namespace App\Enums;

enum UserStatus: string
{
    case ACTIVE = 'ACTIVE';
    case INACTIVE = 'INACTIVE';
    case BLOCKED = 'BLOCKED';
}
```

### 25.3. `CommonStatus.php`

```php
<?php

namespace App\Enums;

enum CommonStatus: string
{
    case ACTIVE = 'ACTIVE';
    case INACTIVE = 'INACTIVE';
}
```

### 25.4. `ElectionStatus.php`

```php
<?php

namespace App\Enums;

enum ElectionStatus: string
{
    case DRAFT = 'DRAFT';
    case SCHEDULED = 'SCHEDULED';
    case ACTIVE = 'ACTIVE';
    case CLOSED = 'CLOSED';
    case RESULTS_PUBLISHED = 'RESULTS_PUBLISHED';
    case SECOND_ROUND_REQUIRED = 'SECOND_ROUND_REQUIRED';
    case CANCELLED = 'CANCELLED';
    case ARCHIVED = 'ARCHIVED';
}
```

### 25.5. `CandidateStatus.php`

```php
<?php

namespace App\Enums;

enum CandidateStatus: string
{
    case PENDING = 'PENDING';
    case VALIDATED = 'VALIDATED';
    case DISQUALIFIED = 'DISQUALIFIED';
    case WITHDRAWN = 'WITHDRAWN';
    case INACTIVE = 'INACTIVE';
}
```

---

## 26. Tabelas Principais da Base de Dados

| Tabela | Finalidade |
|---|---|
| `province` | Províncias de Moçambique |
| `distrit` | Distritos de cada província |
| `delegations` | Delegações da ADEMO ligadas a província e distrito |
| `organs` | Órgãos sociais |
| `positions` | Cargos associados aos órgãos |
| `users` | Utilizadores que entram no sistema |
| `members` | Membros da ADEMO |
| `elections` | Eleições institucionais |
| `election_team` | Comissão e fiscais associados à eleição |
| `candidates` | Candidatos por eleição |
| `election_voters` | Eleitores autorizados por eleição |
| `votes` | Votos sem ligação directa ao eleitor |
| `vote_receipts` | Comprovativos de participação |
| `audit_logs` | Histórico de acções críticas |
| `notifications` | Notificações internas, principalmente para o eleitor |
| `settings` | Preferências da conta |

---

## 27. Campos Principais das Tabelas

### 27.1. `province`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar | Nome da província |
| `code` | varchar nullable unique | Código abreviado |
| `status` | varchar | `ACTIVE`, `INACTIVE` |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.2. `distrit`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `province_id` | FK | Província a que pertence |
| `name` | varchar | Nome do distrito |
| `code` | varchar nullable | Código opcional |
| `status` | varchar | `ACTIVE`, `INACTIVE` |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.3. `delegations`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar | Nome da delegação |
| `province_id` | FK | Referência para `province.id` |
| `district_id` | FK nullable | Referência para `distrit.id` |
| `address` | text nullable | Endereço |
| `status` | varchar | `ACTIVE`, `INACTIVE` |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

> Antes a delegação guardava `province` e `district` como texto. Agora deve guardar `province_id` e `district_id`.

### 27.4. `organs`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar | Nome do órgão |
| `description` | text nullable | Descrição |
| `status` | varchar | `ACTIVE`, `INACTIVE` |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.5. `positions`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `organ_id` | FK | Referência para `organs.id` |
| `name` | varchar | Nome do cargo |
| `description` | text nullable | Descrição |
| `status` | varchar | `ACTIVE`, `INACTIVE` |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.6. `users`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `name` | varchar | Nome do utilizador |
| `access_code` | varchar unique | Código de acesso |
| `email` | varchar nullable unique | E-mail |
| `phone` | varchar nullable | Telefone |
| `password` | varchar | Hash da palavra-passe |
| `role` | varchar | `ADMIN`, `COMMISSION`, `FISCAL`, `VOTER` |
| `status` | varchar | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `delegation_id` | FK nullable | Delegação associada |
| `last_login_at` | timestamp nullable | Último login |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.7. `members`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `member_code` | varchar unique | Código do membro |
| `name` | varchar | Nome |
| `phone` | varchar nullable | Telefone |
| `email` | varchar nullable | E-mail |
| `bi_number` | varchar nullable | BI |
| `delegation_id` | FK | Delegação |
| `status` | varchar | `ACTIVE`, `INACTIVE` |
| `registered_at` | date nullable | Data de registo |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.8. `elections`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `title` | varchar | Título |
| `organ_id` | FK | Órgão |
| `position_id` | FK | Cargo |
| `delegation_id` | FK nullable | Delegação, quando aplicável |
| `parent_election_id` | FK nullable | Para segunda volta |
| `round_number` | integer | 1 para primeira volta, 2 para segunda |
| `starts_at` | timestamp | Início |
| `ends_at` | timestamp | Fim |
| `description` | text nullable | Descrição |
| `allow_blank_vote` | boolean | Permite voto em branco |
| `status` | varchar | Estado |
| `created_by` | FK users | Criador |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.9. `election_team`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `election_id` | FK | Eleição |
| `user_id` | FK | Utilizador da Comissão ou Fiscal |
| `role_in_election` | varchar | Função na eleição |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.10. `candidates`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `election_id` | FK | Eleição |
| `member_id` | FK | Membro candidato |
| `position_id` | FK | Cargo |
| `biography` | text nullable | Biografia |
| `proposal` | text nullable | Proposta |
| `photo_path` | varchar nullable | Foto |
| `document_path` | varchar nullable | Documento |
| `status` | varchar | Estado |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.11. `election_voters`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `election_id` | FK | Eleição |
| `member_id` | FK | Membro autorizado |
| `delegation_id` | FK nullable | Delegação |
| `status` | varchar | Autorizado, removido |
| `has_voted` | boolean | Indica se votou |
| `voted_at` | timestamp nullable | Data do voto |
| `voter_hash` | varchar nullable | Hash para recibo, sem revelar voto |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.12. `votes`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `election_id` | FK | Eleição |
| `candidate_id` | FK nullable | Nulo quando voto em branco |
| `is_blank` | boolean | Voto em branco |
| `proof_hash` | varchar | Hash do comprovativo |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

> Esta tabela não deve guardar `member_id` nem `user_id` para preservar o sigilo do voto.

### 27.13. `vote_receipts`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `election_id` | FK | Eleição |
| `voter_hash` | varchar | Hash do eleitor autorizado |
| `public_code` | varchar unique | Código público do comprovativo |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.14. `audit_logs`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `election_id` | FK nullable | Eleição relacionada |
| `user_id` | FK nullable | Utilizador que praticou a acção |
| `action` | varchar | Acção |
| `entity` | varchar | Entidade afectada |
| `entity_id` | bigint nullable | ID do registo afectado |
| `details` | jsonb nullable | Detalhes sem revelar voto |
| `ip` | varchar nullable | IP |
| `user_agent` | text nullable | Navegador/dispositivo |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.15. `notifications`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `user_id` | FK | Utilizador |
| `title` | varchar | Título |
| `message` | text | Mensagem |
| `type` | varchar | Tipo |
| `read_at` | timestamp nullable | Data de leitura |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

### 27.16. `settings`

| Campo | Tipo sugerido | Observação |
|---|---|---|
| `id` | bigserial | PK |
| `user_id` | FK unique | Utilizador |
| `theme` | varchar | Tema |
| `high_contrast` | boolean | Alto contraste |
| `font_size` | varchar | Tamanho da fonte |
| `email_notifications` | boolean | Notificações por e-mail |
| `system_notifications` | boolean | Notificações internas |
| `whatsapp_notifications` | boolean | Notificações por WhatsApp, futuro |
| `created_at` | timestamp | Laravel |
| `updated_at` | timestamp | Laravel |

---

## 28. Relações Principais

```txt
Province 1 ─── N Distrit
Province 1 ─── N Delegation
Distrit 1 ─── N Delegation

Delegation 1 ─── N User
Delegation 1 ─── N Member
Delegation 1 ─── N Election

Organ 1 ─── N Position
Organ 1 ─── N Election
Position 1 ─── N Election

Election 1 ─── N ElectionTeam
User 1 ─── N ElectionTeam

Election 1 ─── N Candidate
Member 1 ─── N Candidate

Election 1 ─── N ElectionVoter
Member 1 ─── N ElectionVoter
Delegation 1 ─── N ElectionVoter

Election 1 ─── N Vote
Candidate 1 ─── N Vote

Election 1 ─── N VoteReceipt
Election 1 ─── N AuditLog

User 1 ─── N AuditLog
User 1 ─── N Notification
User 1 ─── 1 Setting

Election 1 ─── N Election
parent_election_id para segunda volta
```

---

## 29. Relações nos Models Laravel

### 29.1. `Province.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $table = 'province';

    protected $fillable = [
        'name',
        'code',
        'status',
    ];

    public function districts()
    {
        return $this->hasMany(Distrit::class, 'province_id');
    }

    public function delegations()
    {
        return $this->hasMany(Delegation::class, 'province_id');
    }
}
```

### 29.2. `Distrit.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Distrit extends Model
{
    protected $table = 'distrit';

    protected $fillable = [
        'province_id',
        'name',
        'code',
        'status',
    ];

    public function province()
    {
        return $this->belongsTo(Province::class, 'province_id');
    }

    public function delegations()
    {
        return $this->hasMany(Delegation::class, 'district_id');
    }
}
```

### 29.3. `Delegation.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delegation extends Model
{
    protected $fillable = [
        'name',
        'province_id',
        'district_id',
        'address',
        'status',
    ];

    public function province()
    {
        return $this->belongsTo(Province::class, 'province_id');
    }

    public function district()
    {
        return $this->belongsTo(Distrit::class, 'district_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'delegation_id');
    }

    public function members()
    {
        return $this->hasMany(Member::class, 'delegation_id');
    }

    public function elections()
    {
        return $this->hasMany(Election::class, 'delegation_id');
    }
}
```

### 29.4. `Member.php`

```php
public function delegation()
{
    return $this->belongsTo(Delegation::class, 'delegation_id');
}
```

### 29.5. `User.php`

```php
public function delegation()
{
    return $this->belongsTo(Delegation::class, 'delegation_id');
}

public function settings()
{
    return $this->hasOne(Setting::class, 'user_id');
}
```

### 29.6. `Election.php`

```php
public function organ()
{
    return $this->belongsTo(Organ::class, 'organ_id');
}

public function position()
{
    return $this->belongsTo(Position::class, 'position_id');
}

public function delegation()
{
    return $this->belongsTo(Delegation::class, 'delegation_id');
}

public function parentElection()
{
    return $this->belongsTo(Election::class, 'parent_election_id');
}

public function secondRounds()
{
    return $this->hasMany(Election::class, 'parent_election_id');
}

public function candidates()
{
    return $this->hasMany(Candidate::class, 'election_id');
}

public function voters()
{
    return $this->hasMany(ElectionVoter::class, 'election_id');
}

public function votes()
{
    return $this->hasMany(Vote::class, 'election_id');
}
```

---

## 30. DBML para DB Diagram

```dbml
Table province {
  id bigserial [pk]
  name varchar [not null]
  code varchar [unique]
  status varchar [not null]
  created_at timestamp
  updated_at timestamp
}

Table distrit {
  id bigserial [pk]
  province_id bigint [not null, ref: > province.id]
  name varchar [not null]
  code varchar
  status varchar [not null]
  created_at timestamp
  updated_at timestamp
}

Table delegations {
  id bigserial [pk]
  name varchar [not null]
  province_id bigint [not null, ref: > province.id]
  district_id bigint [ref: > distrit.id]
  address text
  status varchar [not null]
  created_at timestamp
  updated_at timestamp
}

Table organs {
  id bigserial [pk]
  name varchar [not null]
  description text
  status varchar [not null]
  created_at timestamp
  updated_at timestamp
}

Table positions {
  id bigserial [pk]
  organ_id bigint [not null, ref: > organs.id]
  name varchar [not null]
  description text
  status varchar [not null]
  created_at timestamp
  updated_at timestamp
}

Table users {
  id bigserial [pk]
  name varchar [not null]
  access_code varchar [unique, not null]
  email varchar [unique]
  phone varchar
  password varchar [not null]
  role varchar [not null]
  status varchar [not null]
  delegation_id bigint [ref: > delegations.id]
  last_login_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table members {
  id bigserial [pk]
  member_code varchar [unique, not null]
  name varchar [not null]
  phone varchar
  email varchar
  bi_number varchar
  delegation_id bigint [not null, ref: > delegations.id]
  status varchar [not null]
  registered_at date
  created_at timestamp
  updated_at timestamp
}

Table elections {
  id bigserial [pk]
  title varchar [not null]
  organ_id bigint [not null, ref: > organs.id]
  position_id bigint [not null, ref: > positions.id]
  delegation_id bigint [ref: > delegations.id]
  parent_election_id bigint [ref: > elections.id]
  round_number integer [default: 1]
  starts_at timestamp [not null]
  ends_at timestamp [not null]
  description text
  allow_blank_vote boolean [default: true]
  status varchar [not null]
  created_by bigint [not null, ref: > users.id]
  created_at timestamp
  updated_at timestamp
}

Table election_team {
  id bigserial [pk]
  election_id bigint [not null, ref: > elections.id]
  user_id bigint [not null, ref: > users.id]
  role_in_election varchar [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    (election_id, user_id) [unique]
  }
}

Table candidates {
  id bigserial [pk]
  election_id bigint [not null, ref: > elections.id]
  member_id bigint [not null, ref: > members.id]
  position_id bigint [not null, ref: > positions.id]
  biography text
  proposal text
  photo_path varchar
  document_path varchar
  status varchar [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    (election_id, member_id, position_id) [unique]
  }
}

Table election_voters {
  id bigserial [pk]
  election_id bigint [not null, ref: > elections.id]
  member_id bigint [not null, ref: > members.id]
  delegation_id bigint [ref: > delegations.id]
  status varchar [not null]
  has_voted boolean [default: false]
  voted_at timestamp
  voter_hash varchar
  created_at timestamp
  updated_at timestamp

  indexes {
    (election_id, member_id) [unique]
  }
}

Table votes {
  id bigserial [pk]
  election_id bigint [not null, ref: > elections.id]
  candidate_id bigint [ref: > candidates.id]
  is_blank boolean [default: false]
  proof_hash varchar [unique, not null]
  created_at timestamp
  updated_at timestamp
}

Table vote_receipts {
  id bigserial [pk]
  election_id bigint [not null, ref: > elections.id]
  voter_hash varchar [not null]
  public_code varchar [unique, not null]
  created_at timestamp
  updated_at timestamp
}

Table audit_logs {
  id bigserial [pk]
  election_id bigint [ref: > elections.id]
  user_id bigint [ref: > users.id]
  action varchar [not null]
  entity varchar [not null]
  entity_id bigint
  details jsonb
  ip varchar
  user_agent text
  created_at timestamp
  updated_at timestamp
}

Table notifications {
  id bigserial [pk]
  user_id bigint [not null, ref: > users.id]
  title varchar [not null]
  message text [not null]
  type varchar
  read_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table settings {
  id bigserial [pk]
  user_id bigint [unique, not null, ref: > users.id]
  theme varchar
  high_contrast boolean
  font_size varchar
  email_notifications boolean
  system_notifications boolean
  whatsapp_notifications boolean
  created_at timestamp
  updated_at timestamp
}
```

---

## 31. Endpoints da API REST

Todos os endpoints privados devem exigir autenticação com Sanctum.

### 31.1. Autenticação

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Autenticar por código e senha |
| POST | `/api/auth/logout` | Autenticado | Terminar sessão actual |
| POST | `/api/auth/logout-all` | Autenticado | Terminar todas as sessões |
| GET | `/api/auth/me` | Autenticado | Obter utilizador autenticado |
| POST | `/api/auth/forgot-password` | Público | Solicitar recuperação |
| POST | `/api/auth/verify-code` | Público | Validar código |
| POST | `/api/auth/reset-password` | Público | Definir nova senha |

### 31.2. Províncias e Distritos

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/provinces` | ADMIN, COMMISSION, FISCAL | Listar províncias activas |
| GET | `/api/provinces/{id}` | ADMIN, COMMISSION, FISCAL | Consultar província |
| GET | `/api/provinces/{id}/districts` | ADMIN, COMMISSION, FISCAL | Listar distritos de uma província |
| GET | `/api/districts/{id}` | ADMIN, COMMISSION, FISCAL | Consultar distrito |

> O Eleitor não precisa aceder directamente a estes endpoints no MVP.

### 31.3. Delegações

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/delegations` | ADMIN, COMMISSION, FISCAL | Listar delegações |
| POST | `/api/delegations` | ADMIN | Criar delegação |
| GET | `/api/delegations/{id}` | ADMIN, COMMISSION, FISCAL | Consultar delegação |
| PUT | `/api/delegations/{id}` | ADMIN | Actualizar delegação |
| DELETE | `/api/delegations/{id}` | ADMIN | Eliminar/inactivar delegação |

### 31.4. Órgãos e Cargos

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/organs` | ADMIN, COMMISSION, FISCAL | Listar órgãos |
| POST | `/api/organs` | ADMIN | Criar órgão |
| PUT | `/api/organs/{id}` | ADMIN | Actualizar órgão |
| GET | `/api/organs/{id}/positions` | ADMIN, COMMISSION, FISCAL | Listar cargos |
| POST | `/api/organs/{id}/positions` | ADMIN | Criar cargo |
| PUT | `/api/positions/{id}` | ADMIN | Actualizar cargo |

### 31.5. Membros

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/members` | ADMIN, COMMISSION, FISCAL | Listar membros |
| POST | `/api/members` | ADMIN, COMMISSION | Criar membro |
| GET | `/api/members/{id}` | ADMIN, COMMISSION, FISCAL | Consultar membro |
| PUT | `/api/members/{id}` | ADMIN, COMMISSION | Actualizar membro |
| DELETE | `/api/members/{id}` | ADMIN, COMMISSION | Inactivar membro |
| POST | `/api/members/import` | ADMIN, COMMISSION | Importar membros, se implementado |

### 31.6. Utilizadores

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/users` | ADMIN | Listar utilizadores |
| POST | `/api/users` | ADMIN | Criar utilizador operacional |
| GET | `/api/users/{id}` | ADMIN | Consultar utilizador |
| PUT | `/api/users/{id}` | ADMIN | Actualizar utilizador |
| PATCH | `/api/users/{id}/status` | ADMIN | Activar, bloquear ou inactivar |

### 31.7. Eleições

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/elections` | Todos autenticados conforme perfil | Listar eleições conforme permissão |
| POST | `/api/elections` | COMMISSION | Criar eleição |
| GET | `/api/elections/{id}` | Todos autorizados | Consultar detalhes |
| PUT | `/api/elections/{id}` | COMMISSION | Actualizar enquanto permitido |
| PATCH | `/api/elections/{id}/status` | COMMISSION | Alterar estado |
| POST | `/api/elections/{id}/team` | COMMISSION | Definir equipa |
| POST | `/api/elections/{id}/second-round` | COMMISSION | Criar segunda volta em caso de empate |

### 31.8. Candidatos

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/elections/{id}/candidates` | Todos autorizados | Listar candidatos |
| POST | `/api/elections/{id}/candidates` | COMMISSION | Registar candidato |
| GET | `/api/candidates/{id}` | Todos autorizados | Consultar perfil |
| PUT | `/api/candidates/{id}` | COMMISSION | Actualizar candidato |
| PATCH | `/api/candidates/{id}/status` | COMMISSION | Validar, inactivar, retirar ou desqualificar |

### 31.9. Eleitores

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/elections/{id}/voters` | ADMIN, COMMISSION, FISCAL | Listar eleitores autorizados |
| POST | `/api/elections/{id}/voters` | COMMISSION | Adicionar eleitores |
| DELETE | `/api/elections/{id}/voters/{memberId}` | COMMISSION | Remover eleitor antes do início |
| POST | `/api/elections/{id}/credentials` | COMMISSION | Gerar credenciais dos eleitores |

### 31.10. Votação

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/voting/elections` | VOTER | Listar eleições disponíveis ao eleitor |
| GET | `/api/voting/elections/{id}/ballot` | VOTER | Abrir boletim de voto |
| POST | `/api/voting/elections/{id}/confirm` | VOTER | Submeter voto |
| GET | `/api/voting/elections/{id}/receipt` | VOTER | Consultar comprovativo |

### 31.11. Resultados e Auditoria

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/results` | Todos autorizados | Listar eleições com resultados |
| GET | `/api/results/{electionId}` | Todos autorizados | Consultar resultados detalhados |
| POST | `/api/results/{electionId}/publish` | Sistema/COMMISSION | Publicação manual excepcional, se necessário |
| GET | `/api/audit` | ADMIN, FISCAL | Consultar auditoria |
| GET | `/api/elections/{id}/audit` | ADMIN, FISCAL, COMMISSION limitada | Consultar auditoria da eleição |

### 31.12. Notificações e Configurações

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/notifications` | VOTER | Listar notificações do eleitor |
| PATCH | `/api/notifications/{id}/read` | VOTER | Marcar notificação como lida |
| PATCH | `/api/notifications/read-all` | VOTER | Marcar todas como lidas |
| GET | `/api/settings` | Autenticado | Consultar preferências |
| PUT | `/api/settings` | Autenticado | Actualizar tema, acessibilidade e notificações |
| PUT | `/api/settings/email` | Autenticado | Alterar e-mail |
| PUT | `/api/settings/password` | Autenticado | Alterar palavra-passe |

---

## 32. Validações Importantes nos Form Requests

### 32.1. `StoreDelegationRequest`

```php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:150'],
        'province_id' => ['required', 'exists:province,id'],
        'district_id' => ['nullable', 'exists:distrit,id'],
        'address' => ['nullable', 'string'],
        'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
    ];
}
```

### 32.2. `StoreMemberRequest`

```php
public function rules(): array
{
    return [
        'member_code' => ['required', 'string', 'max:50', 'unique:members,member_code'],
        'name' => ['required', 'string', 'max:150'],
        'phone' => ['nullable', 'string', 'max:30'],
        'email' => ['nullable', 'email', 'max:200'],
        'bi_number' => ['nullable', 'string', 'max:50'],
        'delegation_id' => ['required', 'exists:delegations,id'],
        'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        'registered_at' => ['nullable', 'date'],
    ];
}
```

### 32.3. `StoreElectionRequest`

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:200'],
        'organ_id' => ['required', 'exists:organs,id'],
        'position_id' => ['required', 'exists:positions,id'],
        'delegation_id' => ['nullable', 'exists:delegations,id'],
        'parent_election_id' => ['nullable', 'exists:elections,id'],
        'round_number' => ['required', 'integer', 'in:1,2'],
        'starts_at' => ['required', 'date'],
        'ends_at' => ['required', 'date', 'after:starts_at'],
        'description' => ['nullable', 'string'],
        'allow_blank_vote' => ['boolean'],
    ];
}
```

---

## 33. Payloads Importantes para o Frontend React

### 33.1. Criar Delegação

```json
{
  "name": "Delegação de Maputo",
  "province_id": 1,
  "district_id": 5,
  "address": "Cidade de Maputo",
  "status": "ACTIVE"
}
```

### 33.2. Resposta de Delegação

```json
{
  "id": 1,
  "name": "Delegação de Maputo",
  "address": "Cidade de Maputo",
  "status": "ACTIVE",
  "province": {
    "id": 1,
    "name": "Maputo Cidade",
    "code": "MPT"
  },
  "district": {
    "id": 5,
    "name": "KaMpfumo",
    "code": "KMF"
  }
}
```

### 33.3. Criar Membro

```json
{
  "member_code": "MEM-001",
  "name": "Maria António",
  "phone": "840000001",
  "email": "maria@example.com",
  "bi_number": "110100000000A",
  "delegation_id": 1,
  "status": "ACTIVE",
  "registered_at": "2026-05-16"
}
```

### 33.4. Resposta de Membro

```json
{
  "id": 1,
  "member_code": "MEM-001",
  "name": "Maria António",
  "delegation": {
    "id": 1,
    "name": "Delegação de Maputo",
    "province": {
      "id": 1,
      "name": "Maputo Cidade"
    },
    "district": {
      "id": 5,
      "name": "KaMpfumo"
    }
  }
}
```

### 33.5. Criar Eleição — Primeira Volta

```json
{
  "title": "Eleição para Presidente da Mesa da Assembleia",
  "organ_id": 1,
  "position_id": 1,
  "delegation_id": null,
  "parent_election_id": null,
  "round_number": 1,
  "starts_at": "2026-05-20 08:00:00",
  "ends_at": "2026-05-20 17:00:00",
  "allow_blank_vote": true,
  "description": "Eleição geral da ADEMO"
}
```

### 33.6. Criar Eleição — Segunda Volta

```json
{
  "title": "Segunda volta - Presidente da Mesa da Assembleia",
  "organ_id": 1,
  "position_id": 1,
  "delegation_id": null,
  "parent_election_id": 1,
  "round_number": 2,
  "starts_at": "2026-05-25 08:00:00",
  "ends_at": "2026-05-25 17:00:00",
  "allow_blank_vote": true,
  "description": "Segunda volta por empate"
}
```

---

## 34. Como o Frontend Deve Consumir Províncias e Distritos

### 34.1. Formulário de Delegação

Fluxo no frontend:

```txt
Carregar províncias
→ Utilizador selecciona província
→ Carregar distritos dessa província
→ Utilizador selecciona distrito
→ Enviar province_id e district_id
```

### 34.2. Endpoints usados

```http
GET /api/provinces
GET /api/provinces/{id}/districts
POST /api/delegations
PUT /api/delegations/{id}
```

### 34.3. Exemplo de Service no React

```js
import { api } from '../lib/api';

export async function getProvinces() {
  const response = await api.get('/provinces');
  return response.data.data;
}

export async function getDistrictsByProvince(provinceId) {
  const response = await api.get(`/provinces/${provinceId}/districts`);
  return response.data.data;
}
```

### 34.4. Regra de UI

No formulário de delegação:

- O campo `Província` deve ser um `select`;
- O campo `Distrito` deve ser um `select` dependente da província;
- O campo `Distrito` deve ficar desactivado até a província ser escolhida;
- Ao mudar a província, o distrito seleccionado deve ser limpo.

---

## 35. Consultas com Relações no Laravel

### 35.1. Listar Delegações

```php
Delegation::with(['province', 'district'])
    ->latest()
    ->paginate(10);
```

### 35.2. Listar Membros

```php
Member::with(['delegation.province', 'delegation.district'])
    ->latest()
    ->paginate(10);
```

### 35.3. Listar Utilizadores

```php
User::with(['delegation.province', 'delegation.district'])
    ->latest()
    ->paginate(10);
```

### 35.4. Listar Eleições

```php
Election::with([
    'organ',
    'position',
    'delegation.province',
    'delegation.district',
    'parentElection',
])
->latest()
->paginate(10);
```

---

## 36. Formato Padrão das Respostas da API

### 36.1. Sucesso

```json
{
  "success": true,
  "message": "Operação realizada com sucesso.",
  "data": {}
}
```

### 36.2. Erro de Validação

```json
{
  "success": false,
  "message": "Existem campos inválidos.",
  "errors": {
    "email": ["O e-mail é obrigatório."]
  }
}
```

### 36.3. Erro de Permissão

```json
{
  "success": false,
  "message": "Não tem permissão para executar esta acção."
}
```

---

## 37. Ordem Recomendada dos Seeders

A ordem é importante porque existem dependências entre tabelas.

```txt
1. ProvinceSeeder
2. DistritSeeder
3. DelegationSeeder
4. OrganSeeder
5. PositionSeeder
6. UserSeeder
7. MemberSeeder
8. ElectionSeeder
9. ElectionTeamSeeder
10. CandidateSeeder
11. ElectionVoterSeeder
12. VoteSeeder
13. VoteReceiptSeeder
14. AuditLogSeeder
15. NotificationSeeder
16. SettingSeeder
```

Motivo:

```txt
distrit depende de province
delegations depende de province e distrit
members depende de delegations
users depende de delegations
elections depende de delegations, organs, positions e users
```

### 37.1. `DatabaseSeeder.php`

```php
public function run(): void
{
    $this->call([
        ProvinceSeeder::class,
        DistritSeeder::class,
        DelegationSeeder::class,
        OrganSeeder::class,
        PositionSeeder::class,
        UserSeeder::class,
        MemberSeeder::class,
        ElectionSeeder::class,
        ElectionTeamSeeder::class,
        CandidateSeeder::class,
        ElectionVoterSeeder::class,
        VoteSeeder::class,
        VoteReceiptSeeder::class,
        AuditLogSeeder::class,
        NotificationSeeder::class,
        SettingSeeder::class,
    ]);
}
```

---

## 38. Segurança, Sigilo e Auditoria

### 38.1. Segurança

- Guardar palavras-passe apenas com hash seguro;
- Validar permissões no backend;
- Usar Sanctum para rotas privadas;
- Não confiar apenas no frontend para bloquear acções;
- Bloquear utilizadores inactivos ou bloqueados;
- Usar HTTPS em produção;
- Evitar exposição de stack trace em produção.

### 38.2. Sigilo do Voto

- A tabela `votes` não deve guardar `member_id` nem `user_id`;
- A auditoria não deve guardar candidato escolhido;
- O comprovativo deve confirmar participação, mas não revelar escolha;
- O sistema pode marcar que o eleitor votou em `election_voters`, mas sem ligar ao candidato escolhido.

### 38.3. Auditoria

Devem ser auditadas acções como:

- Login;
- Logout;
- Criação de eleição;
- Alteração de eleição;
- Selecção de eleitores;
- Registo de candidatos;
- Alteração de candidato;
- Voto registado, sem conteúdo do voto;
- Publicação de resultados;
- Segunda volta criada;
- Alteração de permissões;
- Inactivação de membro ou utilizador.

---

## 39. Ordem Recomendada de Desenvolvimento

### Fase 1 — Base do projecto

1. Confirmar PHP 8.4;
2. Confirmar Laravel 13;
3. Configurar PostgreSQL;
4. Configurar `.env`;
5. Executar migrations;
6. Instalar Sanctum;
7. Criar resposta JSON padrão.

### Fase 2 — Autenticação

1. Ajustar tabela `users`;
2. Criar `UserRole` e `UserStatus`;
3. Criar `LoginRequest`;
4. Criar `AuthController`;
5. Criar `AuthService`;
6. Implementar login por `access_code` e `password`;
7. Gerar token Sanctum;
8. Criar rota `/api/auth/me`;
9. Criar logout;
10. Testar com Thunder Client/Postman;
11. Integrar com o frontend React.

### Fase 3 — Cadastros base

1. Províncias;
2. Distritos;
3. Delegações;
4. Órgãos;
5. Cargos;
6. Membros;
7. Utilizadores Comissão/Fiscal.

### Fase 4 — Gestão eleitoral

1. Criar eleições;
2. Definir equipa;
3. Seleccionar eleitores;
4. Registar candidatos;
5. Controlar estados;
6. Preparar segunda volta.

### Fase 5 — Votação

1. Listar eleições do eleitor;
2. Abrir boletim;
3. Confirmar voto;
4. Registar voto secreto;
5. Bloquear voto duplicado;
6. Emitir comprovativo.

### Fase 6 — Resultados e auditoria

1. Apurar resultados;
2. Publicar automaticamente;
3. Detectar empate;
4. Criar segunda volta se necessário;
5. Consultar resultados por perfil;
6. Consultar auditoria.

### Fase 7 — Configurações e notificações

1. Configurações da conta;
2. Alterar senha;
3. Alterar e-mail;
4. Tema;
5. Acessibilidade;
6. Notificações do eleitor.

---

## 40. Comandos Úteis

```bash
php -v
composer -V
php artisan serve
php artisan migrate
php artisan migrate:fresh
php artisan migrate:fresh --seed
php artisan route:list
php artisan make:model Nome -m
php artisan make:controller Api/NomeController --api
php artisan make:request NomeRequest
php artisan make:seeder NomeSeeder
php artisan make:middleware CheckRole
php artisan test
```

---

## 41. Pontos que Foram Alterados nesta Versão

| Antes | Agora |
|---|---|
| `delegations.province` como texto | `delegations.province_id` com FK para `province` |
| `delegations.district` como texto | `delegations.district_id` com FK para `distrit` |
| Sem endpoints para províncias | `GET /api/provinces` |
| Sem endpoints para distritos | `GET /api/provinces/{id}/districts` |
| Sem models `Province` e `Distrit` | Models adicionados |
| Relações começavam em `delegations` | Relações agora começam em `province` e `distrit` |
| Formulário de delegação podia usar texto | Frontend deve usar selects dependentes |
| Seeders começavam em delegações | Seeders começam por províncias e distritos |

---

## 42. Resumo Final

Este documento actualiza a estrutura técnica do backend do Sistema de Votação Eleitoral da ADEMO com as decisões mais recentes do projecto.

A prioridade inicial é construir uma base sólida com autenticação, perfis, permissões, PostgreSQL, Sanctum, províncias, distritos, delegações e integração com React. Depois devem ser implementados os módulos de registo e consulta, começando por membros, delegações, órgãos e cargos.

O sistema deve manter sempre três princípios principais:

1. Segurança;
2. Sigilo do voto;
3. Rastreabilidade.

O backend deve ser a fonte real das permissões e regras de negócio. O frontend apenas apresenta ou oculta elementos, mas nunca deve substituir validações do backend.
