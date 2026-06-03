# Documento de Hospedagem - Sistema Eleitoral ADEMO

Este documento explica como hospedar o Sistema Eleitoral ADEMO em produção.

## 1. Componentes do Sistema

Para o sistema funcionar correctamente em produção, devem estar activos:

- Backend Laravel.
- Frontend React.
- Base de dados PostgreSQL.
- Queue Worker.
- Scheduler Laravel.
- Serviço de e-mail SMTP.
- Reverb, caso seja usado tempo real.

## 2. Requisitos do Servidor

Recomendado:

- Ubuntu Server 22.04 ou superior.
- Nginx ou Apache.
- PHP 8.3 ou superior.
- Composer.
- Node.js 20 ou superior.
- PostgreSQL 15 ou superior.
- Supervisor.
- Certificado SSL.

Extensões PHP necessárias:

```bash
php-pgsql
php-mbstring
php-xml
php-curl
php-zip
php-bcmath
php-intl
php-cli
php-fpm
```

## 3. Estrutura Recomendada

Exemplo no servidor:

```text
/var/www/ademo/
  ademo-eleitoral-backend/
  ademo-eleitoral-frontend/
```

O domínio principal pode apontar para o frontend:

```text
https://seudominio.com
```

A API pode usar subdomínio:

```text
https://api.seudominio.com
```

## 4. Configuração do Backend

Entrar na pasta do backend:

```bash
cd /var/www/ademo/ademo-eleitoral-backend
```

Instalar dependências:

```bash
composer install --no-dev --optimize-autoloader
```

Criar ficheiro de produção:

```bash
cp .env.production.example .env
```

Gerar chave da aplicação:

```bash
php artisan key:generate
```

Ou gerar e copiar manualmente:

```bash
php artisan key:generate --show
```

## 5. Exemplo de `.env` de Produção

```env
APP_NAME="Sistema Eleitoral ADEMO"
APP_ENV=production
APP_KEY=base64:COLOQUE_A_CHAVE_AQUI
APP_DEBUG=false
APP_URL=https://api.seudominio.com
FRONTEND_URL=https://seudominio.com

APP_LOCALE=pt
APP_FALLBACK_LOCALE=pt
APP_FAKER_LOCALE=pt_PT
APP_TIMEZONE=Africa/Maputo

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ademo_eleitoral
DB_USERNAME=ademo
DB_PASSWORD=SENHA_FORTE_DA_BASE_DE_DADOS

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
DB_QUEUE=default
DB_QUEUE_RETRY_AFTER=120
QUEUE_FAILED_DRIVER=database-uuids

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=ademo
REVERB_APP_KEY=COLOQUE_UMA_CHAVE_FORTE
REVERB_APP_SECRET=COLOQUE_UM_SECRET_FORTE
REVERB_HOST=api.seudominio.com
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

MAIL_MAILER=smtp
MAIL_HOST=smtp.seuprovedor.com
MAIL_PORT=587
MAIL_USERNAME=seu_email@seudominio.com
MAIL_PASSWORD=SENHA_DO_EMAIL_OU_APP_PASSWORD
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@seudominio.com
MAIL_FROM_NAME="ADEMO Eleitoral"
```

## 6. Base de Dados

Criar base de dados PostgreSQL:

```bash
sudo -u postgres psql
```

Dentro do PostgreSQL:

```sql
CREATE DATABASE ademo_eleitoral;
CREATE USER ademo WITH PASSWORD 'SENHA_FORTE_DA_BASE_DE_DADOS';
GRANT ALL PRIVILEGES ON DATABASE ademo_eleitoral TO ademo;
\q
```

Executar migrations:

```bash
php artisan migrate --force
```

Opcionalmente executar seeders:

```bash
php artisan db:seed --force
```

## 7. Optimização do Laravel

Executar:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

Sempre que alterares `.env`, executar:

```bash
php artisan optimize:clear
php artisan config:cache
```

## 8. Configuração do Frontend

Entrar na pasta do frontend:

```bash
cd /var/www/ademo/ademo-eleitoral-frontend
```

Criar `.env.production`:

```env
VITE_APP_NAME=Sistema Eleitoral ADEMO
VITE_API_URL=https://api.seudominio.com/api
VITE_REVERB_APP_KEY=COLOQUE_A_MESMA_CHAVE_DO_REVERB_APP_KEY
VITE_REVERB_HOST=api.seudominio.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

Instalar dependências:

```bash
npm install
```

Gerar build:

```bash
npm run build
```

A pasta gerada será:

```text
ademo-eleitoral-frontend/dist
```

## 9. Configuração do Nginx Para Backend

Exemplo:

```nginx
server {
    listen 80;
    server_name api.seudominio.com;
    root /var/www/ademo/ademo-eleitoral-backend/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

## 10. Configuração do Nginx Para Frontend

Exemplo:

```nginx
server {
    listen 80;
    server_name seudominio.com;
    root /var/www/ademo/ademo-eleitoral-frontend/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 11. SSL

Instalar Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

Gerar certificados:

```bash
sudo certbot --nginx -d seudominio.com -d api.seudominio.com
```

## 12. Queue Worker

O Queue Worker é obrigatório para:

- Envio de e-mails.
- Notificações por e-mail.
- Processamento em segundo plano.

Comando manual:

```bash
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60 --memory=256
```

## 13. Scheduler

O Scheduler é obrigatório para:

- Abrir eleições automaticamente.
- Encerrar eleições automaticamente.
- Enviar aviso de eleição prestes a terminar.

Comando manual:

```bash
php artisan schedule:work
```

## 14. Reverb

Necessário caso o sistema continue usando notificações ou actualizações em tempo real.

Comando manual:

```bash
php artisan reverb:start --host=0.0.0.0 --port=8080
```

## 15. Supervisor

Criar ficheiro:

```bash
sudo nano /etc/supervisor/conf.d/ademo.conf
```

Conteúdo:

```ini
[program:ademo-queue]
command=php /var/www/ademo/ademo-eleitoral-backend/artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60 --memory=256
directory=/var/www/ademo/ademo-eleitoral-backend
autostart=true
autorestart=true
stopwaitsecs=120
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/supervisor/ademo-queue.log

[program:ademo-scheduler]
command=php /var/www/ademo/ademo-eleitoral-backend/artisan schedule:work
directory=/var/www/ademo/ademo-eleitoral-backend
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/supervisor/ademo-scheduler.log

[program:ademo-reverb]
command=php /var/www/ademo/ademo-eleitoral-backend/artisan reverb:start --host=0.0.0.0 --port=8080
directory=/var/www/ademo/ademo-eleitoral-backend
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/supervisor/ademo-reverb.log
```

Activar:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ademo-queue
sudo supervisorctl start ademo-scheduler
sudo supervisorctl start ademo-reverb
```

Ver estado:

```bash
sudo supervisorctl status
```

## 16. Permissões

Na pasta do backend:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

## 17. Testes Após Hospedagem

Testar API:

```bash
php artisan route:list --path=api --except-vendor
```

Testar migrations:

```bash
php artisan migrate:status
```

Testar filas:

```bash
php artisan queue:failed
```

Testar scheduler manualmente:

```bash
php artisan elections:sync-statuses
```

Testar e-mails:

- Criar utilizador com e-mail.
- Solicitar recuperação de palavra-passe.
- Abrir/concluir uma eleição de teste.
- Confirmar se o e-mail chegou.

## 18. Docker em Produção

Se o servidor tiver Docker instalado, pode-se usar:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Ver serviços:

```bash
docker compose -f docker-compose.prod.yml ps
```

Ver logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

O Docker Compose do projecto inclui:

- `postgres`
- `backend`
- `backend-web`
- `queue`
- `scheduler`
- `reverb`
- `frontend`

## 19. Checklist Final

Antes de colocar em produção, confirmar:

- `APP_ENV=production`.
- `APP_DEBUG=false`.
- `APP_KEY` definida.
- `APP_URL` correcto.
- `FRONTEND_URL` correcto.
- Base de dados criada.
- Migrations executadas.
- SMTP real configurado.
- Queue Worker activo.
- Scheduler activo.
- Reverb activo, se necessário.
- SSL activo.
- Frontend com `VITE_API_URL` correcto.
- Permissões de `storage` e `bootstrap/cache` correctas.
- `php artisan config:cache` executado.
- `npm run build` executado no frontend.

## 20. Pontos Críticos

Sem Queue Worker:

- Os e-mails não serão enviados.
- Notificações por e-mail ficarão pendentes na fila.

Sem Scheduler:

- Eleições não abrirão automaticamente.
- Eleições não serão concluídas automaticamente.
- Avisos de término não serão enviados.

Sem SMTP correcto:

- O sistema processará a fila, mas os e-mails não chegarão aos utilizadores.

Sem SSL:

- O sistema fica inseguro.
- Alguns navegadores podem bloquear funcionalidades modernas.

Sem `APP_DEBUG=false`:

- Dados sensíveis podem aparecer em erros públicos.
