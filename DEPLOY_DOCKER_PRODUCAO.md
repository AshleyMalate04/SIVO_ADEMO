# Deploy em producao com Docker

## 1. Preparar variaveis

Copie os exemplos:

```bash
cp .env.production.example .env.production
cp ademo-eleitoral-backend/.env.production.example ademo-eleitoral-backend/.env.production
```

Depois altere obrigatoriamente:

- `POSTGRES_PASSWORD`
- `DB_PASSWORD`
- `APP_KEY`
- `APP_URL`
- `FRONTEND_URL`
- `REVERB_APP_SECRET`
- dados reais de email, se nao quiser usar `MAIL_MAILER=log`

Gere uma chave Laravel:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build backend
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm --entrypoint php backend artisan key:generate --show
```

Copie o valor gerado para `APP_KEY`.

## 2. Subir a aplicacao

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Servicos criados:

- `frontend`: Nginx com a aplicacao React e proxy para `/api` e Reverb.
- `backend`: Laravel PHP-FPM.
- `backend-web`: Nginx do Laravel.
- `postgres`: base de dados PostgreSQL.
- `queue`: worker da fila Laravel.
- `reverb`: servidor realtime.

## 3. Comandos uteis

Ver logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Executar migracoes manualmente:

```bash
docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
```

Criar link de storage:

```bash
docker compose -f docker-compose.prod.yml exec backend php artisan storage:link
```

Limpar caches:

```bash
docker compose -f docker-compose.prod.yml exec backend php artisan optimize:clear
```

## 4. Observacoes

- O ficheiro real `ademo-eleitoral-backend/.env.production` nao deve ir para o GitHub.
- O ficheiro real `.env.production` tambem nao deve ir para o GitHub.
- Para dominio real e HTTPS, ajuste `APP_URL`, `FRONTEND_URL`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT` e `VITE_REVERB_SCHEME`.
