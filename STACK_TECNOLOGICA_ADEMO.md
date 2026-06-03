# Stack tecnologica do projecto ADEMO

Este documento resume as tecnologias usadas no projecto, a funcao de cada uma, onde aparece no codigo, o que se espera dela e como instalar/executar.

## Visao geral

O projecto esta dividido em duas aplicacoes principais:

- Backend: API Laravel em `ademo-eleitoral-backend`.
- Frontend: aplicacao React/Vite em `ademo-eleitoral-frontend`.

Em producao, o projecto usa Docker Compose com servicos separados para frontend, backend PHP-FPM, Nginx do backend, PostgreSQL, fila e Reverb.

## Frontend

| Tecnologia | Funcao | Porque foi usada | Onde esta implementada | O que se espera | Instalacao/execucao |
|---|---|---|---|---|---|
| React 19 | Construir a interface do sistema | Permite criar telas reutilizaveis com estado e componentes | `ademo-eleitoral-frontend/src/pages`, `src/components`, `src/hooks` | Interface dinamica para admin, comissao, fiscal e eleitor | `npm install` e `npm run dev` |
| Vite | Servidor de desenvolvimento e build do frontend | Build rapido e configuracao simples para React | `ademo-eleitoral-frontend/vite.config.js`, `package.json` | Gerar `dist` para producao e servir em desenvolvimento | `npm run dev`, `npm run build` |
| React Router DOM | Rotas do frontend | Permite navegar entre login, dashboard, membros, delegacoes, eleicoes e portal do eleitor | `src/App.jsx` e paginas em `src/pages` | Abrir cada tela sem recarregar a pagina inteira | Instalado via `npm install` |
| Axios | Comunicacao HTTP com a API | Centraliza chamadas REST para o backend | `src/lib/api.js`, `src/services/*Service.js` | Enviar e receber dados da API Laravel | Configurar `VITE_API_URL` no `.env` |
| Sonner | Notificacoes visuais | Mostrar sucesso, erro e avisos ao utilizador | `src/utils/notify.js` e chamadas `notify.*` nas paginas | Feedback imediato nas operacoes | Instalado via `npm install` |
| Lucide React | Icones da interface | Icones consistentes para botoes, menus e acoes | Imports `lucide-react` em paginas e componentes | Melhor leitura visual das acoes | Instalado via `npm install` |
| Laravel Echo | Cliente realtime | Receber eventos de eleicoes/notificacoes em tempo real | `src/hooks/useRealtimeNotifications.js`, `src/hooks/useElectionRealtime.js` | Atualizar dados sem refresh manual | Requer Reverb configurado no backend |
| Pusher JS | Protocolo WebSocket usado pelo Echo | Compatibilidade com o formato usado pelo Laravel Reverb | `src/lib/realtime.js` | Conectar o frontend ao WebSocket | Configurar `VITE_REVERB_*` |
| Recharts | Graficos e estatisticas | Exibir resultados e indicadores visualmente | Paginas de dashboard/resultados | Graficos claros para acompanhamento eleitoral | Instalado via `npm install` |
| date-fns | Tratamento de datas | Formatacao e manipulacao de datas no frontend | Utilitarios e paginas com periodos eleitorais | Datas legiveis para o utilizador | Instalado via `npm install` |
| React Hook Form | Gestao de formularios | Facilitar validacao e submissao em formularios complexos | Dependencia disponivel no frontend | Formularios mais previsiveis | Instalado via `npm install` |
| Zod | Validacao de dados | Definir regras de validacao estruturadas | Dependencia disponivel no frontend | Validar entradas antes de enviar | Instalado via `npm install` |
| Tailwind CSS | Utilitarios CSS | Disponivel para estilos utilitarios quando necessario | `package.json`, `@tailwindcss/vite` | Apoiar estilização pontual | Instalado via `npm install` |

## Backend

| Tecnologia | Funcao | Porque foi usada | Onde esta implementada | O que se espera | Instalacao/execucao |
|---|---|---|---|---|---|
| PHP 8.3 | Linguagem do backend | Base necessaria para Laravel moderno | `ademo-eleitoral-backend` | Executar API, comandos Artisan e regras de negocio | Instalar PHP 8.3 ou usar Docker |
| Laravel 13 | Framework da API | Fornece rotas, controllers, models, migrations, validacao, mail e auth | `routes/api.php`, `app/Http`, `app/Models`, `database/migrations` | API REST organizada e segura | `composer install`, `php artisan serve` |
| Laravel Sanctum | Autenticacao por token | Permite login e protecao das rotas da API | Models, middleware e endpoints de auth | Tokens para admin, comissao, fiscal e eleitor | `php artisan migrate` |
| Laravel Reverb | WebSocket/realtime | Enviar eventos em tempo real para o frontend | `config/broadcasting.php`, hooks frontend com Echo | Notificacoes e atualizacoes de eleicoes em tempo real | `php artisan reverb:start` |
| Laravel Mail | Envio de emails | Enviar credenciais e notificacoes de acesso | `app/Mail`, `app/Services/AccessNotificationService.php`, `resources/views/emails` | Envio SMTP funcional para membros, comissao e fiscais | Configurar `MAIL_*` no `.env` |
| Laravel Queue | Processamento em fila | Suporta jobs em background quando necessario | `QUEUE_CONNECTION`, tabela `jobs`, servico `queue` no Docker | Processar tarefas sem bloquear o pedido HTTP | `php artisan queue:work` |
| Eloquent ORM | Acesso a base de dados | Trabalhar com tabelas como models PHP | `app/Models` | Consultas legiveis e relacionamentos consistentes | Incluido no Laravel |
| Migrations e Seeders | Criar estrutura e dados iniciais | Controlar schema e dados base do sistema | `database/migrations`, `database/seeders` | Criar tabelas, admin, provincias e distritos | `php artisan migrate --seed` |
| PHPUnit | Testes automaticos | Validar regras principais do backend | `tests` | Garantir que alteracoes nao quebram comportamentos | `php artisan test` |
| Laravel Pint | Formatacao PHP | Manter padrao de codigo Laravel | `composer.json` | Codigo PHP consistente | `vendor/bin/pint` |

## Base de dados e armazenamento

| Tecnologia | Funcao | Porque foi usada | Onde esta implementada | O que se espera | Instalacao/execucao |
|---|---|---|---|---|---|
| PostgreSQL 16 | Base de dados principal | Robusta para dados relacionais e integridade referencial | `.env`, `config/database.php`, `docker-compose.prod.yml` | Guardar usuarios, membros, delegacoes, eleicoes, votos e resultados | Docker ou instalacao local PostgreSQL |
| Laravel Filesystem | Upload e armazenamento de ficheiros | Guardar documentos e ficheiros submetidos | `config/filesystems.php`, controllers com upload | Uploads acessiveis e persistentes | `php artisan storage:link` quando necessario |
| Volumes Docker | Persistencia em producao | Evitar perda de dados ao recriar containers | `docker-compose.prod.yml` | Manter PostgreSQL, storage e cache | Criados automaticamente pelo Docker |

## Infraestrutura

| Tecnologia | Funcao | Porque foi usada | Onde esta implementada | O que se espera | Instalacao/execucao |
|---|---|---|---|---|---|
| Docker | Empacotar aplicacoes | Garante ambiente consistente em producao | `Dockerfile` do frontend e backend | Rodar sem depender da configuracao manual do servidor | Instalar Docker Engine/Desktop |
| Docker Compose | Orquestrar servicos | Sobe frontend, backend, banco, fila e realtime juntos | `docker-compose.prod.yml` | Deploy previsivel com um comando | `docker compose -f docker-compose.prod.yml up -d --build` |
| Nginx | Servir frontend e backend web | Servidor leve para ficheiros estaticos e proxy | `ademo-eleitoral-frontend/docker/nginx`, `ademo-eleitoral-backend/docker/nginx` | Entregar app React e encaminhar chamadas API | Incluido nas imagens Docker |
| PHP-FPM | Executar Laravel em producao | Processo recomendado para Laravel com Nginx | `ademo-eleitoral-backend/Dockerfile` | Processar pedidos PHP da API | Incluido no container backend |
| Node 22 Alpine | Build do frontend | Ambiente leve para instalar dependencias e gerar `dist` | `ademo-eleitoral-frontend/Dockerfile` | Build estavel da app React | Usado automaticamente no Docker |
| Composer 2 | Dependencias PHP | Instalar Laravel e pacotes do backend | `composer.json`, `composer.lock` | Backend com dependencias resolvidas | `composer install` |
| NPM | Dependencias JavaScript | Instalar React, Vite e bibliotecas UI | `package.json`, `package-lock.json` | Frontend pronto para dev/build | `npm install` ou `npm ci` |

## Variaveis de ambiente principais

| Variavel | Onde | Funcao |
|---|---|---|
| `VITE_API_URL` | Frontend | URL base da API Laravel |
| `VITE_REVERB_APP_KEY` | Frontend | Chave publica do WebSocket |
| `VITE_REVERB_HOST` | Frontend | Host do servidor Reverb |
| `VITE_REVERB_PORT` | Frontend | Porta do servidor Reverb |
| `APP_URL` | Backend | URL base da aplicacao |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Backend | Ligacao ao PostgreSQL |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION` | Backend | Envio de emails por SMTP |
| `BROADCAST_CONNECTION` | Backend | Define Reverb como broadcast |
| `QUEUE_CONNECTION` | Backend | Define o driver da fila |
| `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, `REVERB_HOST`, `REVERB_PORT` | Backend | Configuracao do realtime |

## Execucao local

Backend:

```bash
cd ademo-eleitoral-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Frontend:

```bash
cd ademo-eleitoral-frontend
npm install
cp .env.example .env
npm run dev
```

Realtime, quando necessario:

```bash
cd ademo-eleitoral-backend
php artisan reverb:start
php artisan queue:work
```

## Execucao em producao com Docker

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Depois de subir, confirme:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

## Resultado esperado

Com esta stack, espera-se que:

- O frontend carregue uma interface responsiva para cada perfil.
- O backend exponha API REST protegida por token.
- PostgreSQL guarde os dados eleitorais com integridade.
- Reverb envie eventos em tempo real para notificacoes e eleicoes.
- SMTP envie emails de acesso.
- Docker permita publicar o sistema com servicos separados e persistencia.
