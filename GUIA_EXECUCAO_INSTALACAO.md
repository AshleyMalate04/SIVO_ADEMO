# Guia de execução e instalação — ADEMO Eleitoral

Este guia explica como preparar e correr o sistema em ambiente local, com backend Laravel, frontend React e actualizações em tempo real com Laravel Reverb.

## 1. Pré-requisitos

Instale antes:

- PHP 8.3 ou superior;
- Composer;
- Node.js e npm;
- PostgreSQL;
- pgAdmin, opcional;
- Extensões PHP necessárias para Laravel e PostgreSQL, como `pdo_pgsql`.

## 2. Backend Laravel

Entre na pasta do backend:

```bash
cd ademo-eleitoral-backend
```

Instale as dependências:

```bash
composer install
```

Copie o ficheiro de ambiente:

```bash
copy .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Gere a chave da aplicação:

```bash
php artisan key:generate
```

Configure no `.env`:

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173
APP_TIMEZONE=Africa/Maputo
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=ademo_eleitoral
DB_USERNAME=postgres
DB_PASSWORD=
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database
```

Crie as pastas temporárias se necessário:

```cmd
mkdir storage\framework\views
mkdir storage\framework\cache
mkdir storage\framework\cache\data
mkdir storage\framework\sessions
mkdir storage\logs
```

Execute as migrations:

```bash
php artisan migrate
```

Se quiser limpar a base de dados e recriar tudo:

```bash
php artisan migrate:fresh --seed
```

Ligue o link do storage para imagens/documentos:

```bash
php artisan storage:link
```

## 3. Frontend React

Entre na pasta do frontend:

```bash
cd ademo-eleitoral-frontend
```

Instale as dependências:

```bash
npm install
```

Copie o ambiente:

```cmd
copy .env.example .env
```

Confirme:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_REVERB_APP_KEY=ademo_key
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

## 4. Como correr o sistema completo

Abra 5 terminais.

### Terminal 1 — API Laravel

```bash
cd ademo-eleitoral-backend
php artisan serve
```

### Terminal 2 — Reverb

```bash
cd ademo-eleitoral-backend
php artisan reverb:start
```

### Terminal 3 — Queue

```bash
cd ademo-eleitoral-backend
php artisan queue:work --verbose
```

### Terminal 4 — Schedule

```bash
cd ademo-eleitoral-backend
php artisan schedule:work
```

Este terminal é importante para actualizar automaticamente o estado das eleições com base na hora.

### Terminal 5 — React

```bash
cd ademo-eleitoral-frontend
npm run dev
```

## 5. Testar Realtime

1. Abra o sistema em duas janelas: uma como Comissão e outra como Eleitor.
2. Na janela da Comissão, altere o estado de uma eleição ou publique resultados.
3. Na janela do Eleitor ou Resultados, os dados devem actualizar sem recarregar a página.
4. No Chrome, pode confirmar em `F12 > Network > WS`. Deve aparecer uma ligação WebSocket para `127.0.0.1:8080`.

## 6. Observações importantes

- Primeiro execute `composer install`, depois active/configure o Reverb no `.env`.
- Não partilhe `.env`, senhas, `vendor`, `node_modules` nem `.git`.
- Se o Reverb não actualizar, confirme se `php artisan reverb:start`, `queue:work` e `schedule:work` estão abertos.
