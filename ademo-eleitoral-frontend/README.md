# Sistema Eleitoral ADEMO — Frontend

Frontend do **Sistema de Votação Eleitoral da ADEMO**, desenvolvido em **React JavaScript** com **Vite**.  
Este projecto faz parte de uma plataforma web institucional para gestão e execução de eleições internas da ADEMO.

O frontend comunica com uma API REST desenvolvida em **Laravel**, responsável pela autenticação, regras de negócio, votação, resultados, auditoria e permissões. A estrutura segue o documento técnico do projecto, que define React JavaScript no frontend, Laravel no backend e uma base de dados relacional para o sistema eleitoral.  

---

## 1. Tecnologias Utilizadas

- React
- JavaScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React
- React Hook Form
- Zod
- TanStack Table
- Date-fns
- Recharts
- Sonner
- Laravel Echo
- Pusher JS

---

## 2. Criar o Projecto

```bash
npm create vite@latest ademo-eleitoral-frontend -- --template react



# Sistema de Votação Eleitoral — ADEMO

Plataforma web institucional para gestão e execução de eleições internas da ADEMO, desenvolvida com **React JavaScript** no frontend e **Laravel API REST** no backend.

O sistema tem como objectivo apoiar o processo de actualização dos órgãos sociais da ADEMO, permitindo gerir membros, delegações, órgãos, cargos, eleições, candidatos, eleitores autorizados, votação, resultados, auditoria, notificações e configurações da conta.

---

## 1. Visão Geral

O Sistema de Votação Eleitoral da ADEMO é uma solução web criada para tornar o processo eleitoral mais organizado, seguro, rastreável e acessível.

A aplicação permite:

- Autenticação por código de acesso e palavra-passe;
- Recuperação de acesso;
- Gestão de delegações/províncias;
- Gestão de órgãos sociais e cargos;
- Gestão de membros;
- Gestão de Comissão Eleitoral e Fiscais;
- Criação e configuração de eleições;
- Registo de candidatos;
- Selecção de eleitores autorizados;
- Votação electrónica;
- Consulta de resultados;
- Auditoria de acções críticas;
- Notificações internas;
- Configurações de conta, tema e acessibilidade.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Finalidade |
|---|---|---|
| Frontend | React + JavaScript + Vite | Interface web moderna e componentizada |
| Estilização | Tailwind CSS | Design system, responsividade e acessibilidade |
| Roteamento | React Router DOM | Navegação entre telas |
| HTTP Client | Axios | Comunicação com a API Laravel |
| Ícones | Lucide React | Ícones da interface |
| Formulários | React Hook Form | Gestão de formulários |
| Validação | Zod | Validação de dados |
| Tabelas | TanStack Table | Tabelas com filtros, paginação e ordenação |
| Datas | date-fns | Formatação e manipulação de datas |
| Gráficos | Recharts | Visualização de resultados |
| Toasts | Sonner | Mensagens de sucesso, erro e aviso |
| Realtime | Laravel Echo + Pusher JS | Actualizações em tempo real |
| Backend | Laravel | API REST, regras de negócio e autenticação |
| Autenticação | Laravel Sanctum | Protecção de rotas e sessões |
| Base de Dados | PostgreSQL ou MySQL | Persistência relacional |
| Realtime Backend | Laravel Reverb | WebSocket e broadcasting |

---

## 3. Arquitectura Geral

A solução segue uma arquitectura em camadas.

```txt
[Utilizador]
     ↓
[React JavaScript - Interface Web]
     ↓ HTTP/JSON
[Laravel API - Controllers]
     ↓
[Services - Regras de Negócio]
     ↓
[Models/Repositories - Eloquent]
     ↓
[Base de Dados Relacional]
     ↓
[Auditoria, Segurança e Logs]
#Resposibilidade das Camadas
| Camada               | Responsabilidade                                                             |
| -------------------- | ---------------------------------------------------------------------------- |
| Interface Web        | Telas, componentes, formulários, tabelas, navegação e feedback visual        |
| API/Controllers      | Receber pedidos, validar dados iniciais e devolver respostas JSON            |
| Services             | Regras de negócio: criar eleição, votar, publicar resultados, auditar acções |
| Models/Eloquent      | Representar entidades e relações da base de dados                            |
| Policies/Middlewares | Controlar permissões por perfil                                              |
| Auditoria            | Registar acções críticas sem revelar o conteúdo do voto                      |
#Estrutura do frontend
ademo-eleitoral-frontend/
├── public/
│   └── logo-ademo.svg
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── providers.jsx
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── feedback/
│   │   └── election/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── delegations/
│   │   ├── organs/
│   │   ├── members/
│   │   ├── users/
│   │   ├── elections/
│   │   ├── candidates/
│   │   ├── voters/
│   │   ├── voting/
│   │   ├── results/
│   │   ├── audit/
│   │   ├── notifications/
│   │   └── settings/
│   ├── hooks/
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── electionService.js
│   │   └── resultService.js
│   ├── utils/
│   ├── constants/
│   ├── styles/
│   └── main.jsx
├── .env
├── package.json
└── vite.config.js

#Estrutura Backend
ademo-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   ├── Policies/
│   ├── Services/
│   │   ├── AuthService.php
│   │   ├── ElectionService.php
│   │   ├── VotingService.php
│   │   ├── ResultService.php
│   │   └── AuditService.php
│   ├── Enums/
│   └── Notifications/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   ├── api.php
│   └── web.php
├── config/


#Rotas do Fronend
| Rota                          | Perfil                  | Tela                   |
| ----------------------------- | ----------------------- | ---------------------- |
| `/login`                      | Todos                   | Login                  |
| `/recuperar-acesso`           | Todos                   | Recuperação de acesso  |
| `/verificar-codigo`           | Todos                   | Verificação de código  |
| `/nova-senha`                 | Todos                   | Nova palavra-passe     |
| `/dashboard`                  | Admin, Comissão, Fiscal | Painel inicial         |
| `/delegacoes`                 | Admin, Comissão, Fiscal | Delegações             |
| `/orgaos-cargos`              | Admin, Comissão, Fiscal | Órgãos e cargos        |
| `/membros`                    | Admin, Comissão, Fiscal | Membros                |
| `/utilizadores`               | Admin                   | Comissão e Fiscal      |
| `/eleicoes`                   | Todos                   | Lista de eleições      |
| `/eleicoes/nova`              | Comissão                | Criar eleição          |
| `/eleicoes/:id`               | Todos autorizados       | Detalhes da eleição    |
| `/eleicoes/:id/equipa`        | Comissão                | Definir equipa         |
| `/eleicoes/:id/candidatos`    | Comissão, Fiscal, Admin | Candidatos da eleição  |
| `/eleicoes/:id/eleitores`     | Comissão, Fiscal, Admin | Eleitores autorizados  |
| `/votar/:eleicaoId`           | Eleitor                 | Boletim de voto        |
| `/votar/:eleicaoId/confirmar` | Eleitor                 | Confirmação do voto    |
| `/resultados`                 | Todos autorizados       | Resultados             |
| `/auditoria`                  | Admin, Fiscal           | Auditoria              |
| `/notificacoes`               | Todos                   | Notificações           |
| `/configuracoes`              | Todos                   | Configurações da conta |
