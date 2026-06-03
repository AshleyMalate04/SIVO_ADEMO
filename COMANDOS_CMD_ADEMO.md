# Comandos CMD - Sistema Eleitoral ADEMO

Este documento reúne os comandos principais para executar, testar e preparar o projecto.

## 1. Entrar na pasta do projecto

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3
```

## 2. Backend Laravel

```bat
cd ademo-eleitoral-backend
```

Instalar dependências PHP:

```bat
composer install
```

Criar `.env` se ainda não existir:

```bat
copy .env.example .env
```

Gerar chave da aplicação:

```bat
php artisan key:generate
```

Executar migrations:

```bat
php artisan migrate
```

Executar seeders, se precisares carregar dados iniciais:

```bat
php artisan db:seed
```

Iniciar API Laravel:

```bat
php artisan serve
```

## 3. Filas e Notificações

Abrir outro terminal na pasta `ademo-eleitoral-backend` e executar:

```bat
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60
```

Este comando é obrigatório para processar:

- E-mails.
- Notificações por fila.
- Confirmação de voto por e-mail.
- Avisos de eleições.

Ver jobs falhados:

```bat
php artisan queue:failed
```

Tentar novamente todos os jobs falhados:

```bat
php artisan queue:retry all
```

Limpar jobs falhados:

```bat
php artisan queue:flush
```

## 4. Scheduler

Abrir outro terminal na pasta `ademo-eleitoral-backend` e executar:

```bat
php artisan schedule:work
```

Este comando é obrigatório para:

- Abrir eleições automaticamente.
- Encerrar eleições automaticamente.
- Enviar aviso de votação prestes a terminar.

Também podes testar a sincronização manualmente:

```bat
php artisan elections:sync-statuses
```

## 5. Reverb / Tempo Real

Abrir outro terminal na pasta `ademo-eleitoral-backend` e executar:

```bat
php artisan reverb:start --host=0.0.0.0 --port=8080
```

## 6. Frontend React

Voltar à pasta principal:

```bat
cd ..
```

Entrar no frontend:

```bat
cd ademo-eleitoral-frontend
```

Instalar dependências:

```bat
npm install
```

Iniciar frontend:

```bat
npm run dev
```

## 7. Comandos Para Rodar Tudo Localmente

Terminal 1:

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-backend
php artisan serve
```

Terminal 2:

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-backend
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60
```

Terminal 3:

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-backend
php artisan schedule:work
```

Terminal 4:

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-backend
php artisan reverb:start --host=0.0.0.0 --port=8080
```

Terminal 5:

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-frontend
npm run dev
```

## 8. Testes e Verificação

Backend:

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-backend
php artisan test
```

Listar rotas da API:

```bat
php artisan route:list --path=api --except-vendor
```

Validar migrations sem aplicar:

```bat
php artisan migrate --pretend
```

Compilar/verificar views Blade:

```bat
php artisan view:cache
```

Limpar cache:

```bat
php artisan optimize:clear
```

Frontend:

```bat
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-frontend
npm run build
```

## 9. Produção Sem Docker

Na pasta `ademo-eleitoral-backend`:

```bat
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

Worker de fila:

```bat
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60 --memory=256
```

Scheduler:

```bat
php artisan schedule:work
```

## 10. Docker Produção

Antes de subir com Docker, criar o ficheiro:

```bat
copy ademo-eleitoral-backend\.env.production.example ademo-eleitoral-backend\.env.production
```

Editar `ademo-eleitoral-backend\.env.production` com dados reais:

- `APP_KEY`
- `APP_URL`
- `FRONTEND_URL`
- `DB_PASSWORD`
- `MAIL_HOST`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM_ADDRESS`
- `REVERB_APP_SECRET`

Gerar uma chave local para copiar para `APP_KEY`, se necessário:

```bat
cd ademo-eleitoral-backend
php artisan key:generate --show
```

Voltar à pasta principal:

```bat
cd ..
```

Subir tudo com Docker:

```bat
docker compose -f docker-compose.prod.yml up -d --build
```

Ver containers:

```bat
docker compose -f docker-compose.prod.yml ps
```

Ver logs:

```bat
docker compose -f docker-compose.prod.yml logs -f
```

Ver logs apenas da fila:

```bat
docker compose -f docker-compose.prod.yml logs -f queue
```

Ver logs apenas do scheduler:

```bat
docker compose -f docker-compose.prod.yml logs -f scheduler
```

Executar migrations dentro do container:

```bat
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
```

Executar testes dentro do container:

```bat
docker compose -f docker-compose.prod.yml exec backend php artisan test
```

Parar containers:

```bat
docker compose -f docker-compose.prod.yml down
```

## 11. Ordem Recomendada Para Desenvolvimento Local

1. Subir PostgreSQL ou garantir que a base de dados está activa.
2. Executar `php artisan migrate`.
3. Executar `php artisan serve`.
4. Executar `php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60`.
5. Executar `php artisan schedule:work`.
6. Executar `php artisan reverb:start --host=0.0.0.0 --port=8080`.
7. Executar `npm run dev` no frontend.

## 12. Comandos Essenciais Para Notificações Funcionarem

```bat
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60
php artisan schedule:work
php artisan reverb:start --host=0.0.0.0 --port=8080
```

Sem `queue:work`, os e-mails não são enviados.

Sem `schedule:work`, eleições não mudam automaticamente de estado e os avisos de término não disparam.

Sem `reverb:start`, as notificações em tempo real podem não aparecer imediatamente no frontend.
