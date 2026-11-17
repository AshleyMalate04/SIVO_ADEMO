# Documento de Hospedagem - Sistema Eleitoral ADEMO

Este documento explica, passo a passo, como hospedar o Sistema Eleitoral ADEMO usando o projecto que esta no Git.

Existem dois cenarios:

1. Hospedagem inicial sem dominio, usando apenas o IP do servidor.
2. Hospedagem final com dominio e SSL.

> Exemplo usado neste documento:
>
> - IP do servidor: `SEU_IP_DO_SERVIDOR`
> - Pasta do projecto no servidor: `/var/www/ademo`
> - Backend Laravel: `/var/www/ademo/ademo-eleitoral-backend`
> - Frontend React: `/var/www/ademo/ademo-eleitoral-frontend`

Substitua `SEU_IP_DO_SERVIDOR`, `seu-dominio.com`, `api.seu-dominio.com` e as senhas pelos seus dados reais.

---

## 1. Antes de Enviar Para o Servidor

No seu computador local, confirme que todas as alteracoes estao no Git.

```bash
git status
git add .
git commit -m "Preparar sistema ADEMO para hospedagem"
git push origin main
```

Se a branch principal nao for `main`, use o nome correcto, por exemplo:

```bash
git push origin master
```

Nao envie ficheiros `.env` reais para o Git. O servidor deve ter o seu proprio `.env`.

---

## 1A. Hospedagem Com Codigo Compilado Quando Tiver Acesso ao Servidor

Este e o modo recomendado quando quiser colocar o sistema num servidor sem publicar o codigo React original no servidor.

Ponto importante:

- O frontend React pode e deve ser compilado. No servidor fica apenas a pasta `dist`.
- O backend Laravel e PHP. PHP nao gera um executavel compilado como React; o servidor precisa dos ficheiros PHP do backend para executar a API.
- Para reduzir exposicao, envie apenas o pacote necessario do backend, sem `.git`, sem `node_modules`, sem ficheiros `.env` locais, sem documentacao desnecessaria e sem o codigo fonte do frontend.

### 1A.1 Preparar o frontend compilado no computador local

Entre na pasta do frontend:

```bash
cd ademo-eleitoral-frontend
```

Crie ou edite o ficheiro `.env.production` antes do build.

Se ainda nao tiver dominio e vai usar IP:

```env
VITE_API_URL=http://SEU_IP_DO_SERVIDOR:8080/api
VITE_REALTIME_ENABLED=false
```

Se ja tiver dominio:

```env
VITE_API_URL=https://api.seu-dominio.com/api
VITE_REALTIME_ENABLED=false
```

Se tambem publicar Reverb/WebSocket em producao, entao configure:

```env
VITE_REALTIME_ENABLED=true
VITE_REVERB_APP_KEY=ademo_key
VITE_REVERB_HOST=api.seu-dominio.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

Gerar o build:

```bash
npm install
npm run build
```

Depois do build, a pasta que deve ir para o servidor e:

```text
ademo-eleitoral-frontend/dist
```

Nao precisa enviar:

```text
ademo-eleitoral-frontend/src
ademo-eleitoral-frontend/node_modules
ademo-eleitoral-frontend/package.json
ademo-eleitoral-frontend/package-lock.json
```

### 1A.2 Criar pacote do frontend para enviar

No Windows PowerShell, a partir da raiz do projecto:

```powershell
Compress-Archive -Path .\ademo-eleitoral-frontend\dist\* -DestinationPath .\frontend-dist.zip -Force
```

No Linux/macOS:

```bash
cd ademo-eleitoral-frontend/dist
zip -r ../../frontend-dist.zip .
```

### 1A.3 Preparar pacote do backend Laravel

O backend precisa ir para o servidor, mas envie apenas o necessario.

No computador local:

```bash
cd ademo-eleitoral-backend
composer install --no-dev --optimize-autoloader
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

Crie um pacote contendo estes itens:

```text
app
bootstrap
config
database
public
resources
routes
storage
vendor
artisan
composer.json
composer.lock
```

Nao envie:

```text
.git
.env
node_modules
tests
storage/logs/*
storage/framework/cache/*
storage/framework/sessions/*
storage/framework/views/*
```

No Windows PowerShell, a partir da raiz do projecto, um caminho simples e criar uma pasta temporaria:

```powershell
New-Item -ItemType Directory -Force -Path .\release\backend | Out-Null
Copy-Item .\ademo-eleitoral-backend\app .\release\backend\app -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\bootstrap .\release\backend\bootstrap -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\config .\release\backend\config -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\database .\release\backend\database -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\public .\release\backend\public -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\resources .\release\backend\resources -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\routes .\release\backend\routes -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\storage .\release\backend\storage -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\vendor .\release\backend\vendor -Recurse -Force
Copy-Item .\ademo-eleitoral-backend\artisan .\release\backend\artisan -Force
Copy-Item .\ademo-eleitoral-backend\composer.json .\release\backend\composer.json -Force
Copy-Item .\ademo-eleitoral-backend\composer.lock .\release\backend\composer.lock -Force
Compress-Archive -Path .\release\backend\* -DestinationPath .\backend-laravel.zip -Force
```

### 1A.4 Enviar pacotes para o servidor

Quando tiver acesso SSH ao servidor:

```bash
scp frontend-dist.zip root@SEU_IP_DO_SERVIDOR:/tmp/frontend-dist.zip
scp backend-laravel.zip root@SEU_IP_DO_SERVIDOR:/tmp/backend-laravel.zip
```

Entrar no servidor:

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

Criar pastas:

```bash
mkdir -p /var/www/ademo/frontend
mkdir -p /var/www/ademo/backend
```

Extrair frontend compilado:

```bash
unzip -o /tmp/frontend-dist.zip -d /var/www/ademo/frontend
```

Extrair backend:

```bash
unzip -o /tmp/backend-laravel.zip -d /var/www/ademo/backend
```

Criar o `.env` real do backend no servidor:

```bash
cd /var/www/ademo/backend
nano .env
```

Exemplo sem dominio:

```env
APP_NAME="Sistema Eleitoral ADEMO"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://SEU_IP_DO_SERVIDOR:8080
FRONTEND_URL=http://SEU_IP_DO_SERVIDOR
CORS_ALLOWED_ORIGINS=http://SEU_IP_DO_SERVIDOR
```

Exemplo com dominio:

```env
APP_NAME="Sistema Eleitoral ADEMO"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.seu-dominio.com
FRONTEND_URL=https://seu-dominio.com
CORS_ALLOWED_ORIGINS=https://seu-dominio.com
```

Regra essencial:

- `APP_URL` e sempre o endereco do backend/API.
- `FRONTEND_URL` e sempre o endereco do React.
- Nunca coloque `FRONTEND_URL` com porta `8000`, porque `8000` e backend. Se fizer isso, os botoes dos emails vao abrir a API e mostrar `Recurso nao encontrado`.

Depois configurar base de dados, SMTP, migrations, Nginx, Supervisor e SSL seguindo as seccoes seguintes deste documento.

### 1A.5 Actualizar versao compilada no servidor

Quando alterar apenas o frontend:

```bash
cd ademo-eleitoral-frontend
npm run build
```

Depois envie novamente apenas `frontend-dist.zip` e extraia:

```bash
unzip -o /tmp/frontend-dist.zip -d /var/www/ademo/frontend
```

Quando alterar o backend:

1. Gere novo `backend-laravel.zip`.
2. Envie para `/tmp/backend-laravel.zip`.
3. Extraia em `/var/www/ademo/backend`.
4. Execute:

```bash
cd /var/www/ademo/backend
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
supervisorctl restart all
systemctl reload nginx
```

---

## 2. Requisitos do Servidor

Recomendado:

- Ubuntu Server 22.04 ou 24.04.
- Acesso SSH.
- PHP 8.3 ou superior.
- Composer.
- Node.js 20 ou superior.
- PostgreSQL 15 ou superior.
- Nginx.
- Supervisor.
- Servico SMTP real para envio de e-mails.

Docker nao e obrigatorio. Use Docker apenas se quiser subir tudo por containers. Como actualmente o seu computador nao tem Docker instalado, este guia principal usa instalacao normal no servidor.

---

## 3. Entrar no Servidor

No seu computador:

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

Actualizar o servidor:

```bash
apt update
apt upgrade -y
```

Instalar dependencias:

```bash
apt install -y nginx git unzip curl supervisor postgresql postgresql-contrib
apt install -y php php-fpm php-cli php-pgsql php-mbstring php-xml php-curl php-zip php-bcmath php-intl
```

Instalar Composer:

```bash
curl -sS https://getcomposer.org/installer -o composer-setup.php
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
composer --version
```

Instalar Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

---

## 4. Baixar o Projecto do Git

Criar a pasta:

```bash
mkdir -p /var/www
cd /var/www
```

Clonar o projecto:

```bash
git clone URL_DO_SEU_REPOSITORIO_GIT ademo
```

Entrar no projecto:

```bash
cd /var/www/ademo
```

Confirmar estrutura:

```bash
ls
```

Deve existir:

```text
ademo-eleitoral-backend
ademo-eleitoral-frontend
```

---

## 5. Criar a Base de Dados

Entrar no PostgreSQL:

```bash
sudo -u postgres psql
```

Executar:

```sql
CREATE DATABASE ademo_eleitoral;
CREATE USER ademo WITH PASSWORD 'SENHA_FORTE_DA_BASE_DE_DADOS';
GRANT ALL PRIVILEGES ON DATABASE ademo_eleitoral TO ademo;
\q
```

Em PostgreSQL 15 ou superior, tambem pode ser necessario:

```bash
sudo -u postgres psql -d ademo_eleitoral
```

```sql
GRANT ALL ON SCHEMA public TO ademo;
\q
```

---

## 6. Configurar o Backend Laravel

Entrar no backend:

```bash
cd /var/www/ademo/ademo-eleitoral-backend
```

Instalar dependencias:

```bash
composer install --no-dev --optimize-autoloader
```

Criar `.env`:

```bash
cp .env.production.example .env
```

Gerar APP_KEY:

```bash
php artisan key:generate
```

Editar `.env`:

```bash
nano .env
```

---

## 7. `.env` do Backend Sem Dominio

Enquanto nao tiver dominio, use o IP do servidor.

Exemplo:

```env
APP_NAME="Sistema Eleitoral ADEMO"
APP_ENV=production
APP_KEY=base64:SUA_CHAVE_GERADA
APP_DEBUG=false
APP_URL=http://SEU_IP_DO_SERVIDOR:8080
FRONTEND_URL=http://SEU_IP_DO_SERVIDOR

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

MAIL_MAILER=smtp
MAIL_HOST=smtp.seuprovedor.com
MAIL_PORT=587
MAIL_USERNAME=seu_email@provedor.com
MAIL_PASSWORD=SENHA_DO_EMAIL_OU_APP_PASSWORD
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=seu_email@provedor.com
MAIL_FROM_NAME="ADEMO Eleitoral"

BROADCAST_CONNECTION=log
```

Nota importante:

- Sem dominio, o backend ficara em `http://SEU_IP_DO_SERVIDOR:8080`.
- O frontend ficara em `http://SEU_IP_DO_SERVIDOR`.
- As notificacoes por e-mail nao precisam de Reverb.
- Reverb so e necessario se voltar a usar notificacoes internas em tempo real.

---

## 8. Preparar a Base de Dados da Aplicacao

No backend:

```bash
php artisan migrate --force
```

Se for uma instalacao inicial e quiser criar dados base:

```bash
php artisan db:seed --force
```

Criar tabelas de fila, cache e sessoes se ainda nao existirem:

```bash
php artisan queue:table
php artisan queue:failed-table
php artisan cache:table
php artisan session:table
php artisan migrate --force
```

Se alguma migration ja existir, o Laravel avisara. Nesse caso, basta continuar.

Criar link de storage:

```bash
php artisan storage:link
```

Optimizar Laravel:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Permissoes:

```bash
chown -R www-data:www-data /var/www/ademo/ademo-eleitoral-backend/storage /var/www/ademo/ademo-eleitoral-backend/bootstrap/cache
chmod -R 775 /var/www/ademo/ademo-eleitoral-backend/storage /var/www/ademo/ademo-eleitoral-backend/bootstrap/cache
```

---

## 9. Configurar o Frontend Sem Dominio

Entrar no frontend:

```bash
cd /var/www/ademo/ademo-eleitoral-frontend
```

Criar `.env.production`:

```bash
nano .env.production
```

Conteudo:

```env
VITE_APP_NAME=Sistema Eleitoral ADEMO
VITE_API_URL=http://SEU_IP_DO_SERVIDOR:8080/api
```

Instalar dependencias e gerar build:

```bash
npm install
npm run build
```

Depois do build, a pasta publicada sera:

```text
/var/www/ademo/ademo-eleitoral-frontend/dist
```

---

## 10. Nginx Sem Dominio

Neste cenario, o frontend usa a porta `80` e a API usa a porta `8080`.

Criar configuracao:

```bash
nano /etc/nginx/sites-available/ademo
```

Conteudo:

```nginx
server {
    listen 80;
    server_name SEU_IP_DO_SERVIDOR;

    root /var/www/ademo/ademo-eleitoral-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 8080;
    server_name SEU_IP_DO_SERVIDOR;

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

Activar:

```bash
ln -s /etc/nginx/sites-available/ademo /etc/nginx/sites-enabled/ademo
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Abrir portas no firewall, caso use UFW:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 8080/tcp
ufw enable
ufw status
```

Testar no navegador:

```text
http://SEU_IP_DO_SERVIDOR
```

Testar API:

```text
http://SEU_IP_DO_SERVIDOR:8080/api
```

---

## 11. Configurar Queue Worker e Scheduler

O Queue Worker e obrigatorio para envio de e-mails. Sem ele, as notificacoes entram na fila mas nao sao enviadas.

O Scheduler e obrigatorio para:

- Abrir eleicoes automaticamente.
- Encerrar eleicoes automaticamente.
- Enviar aviso de eleicao prestes a terminar.

Criar ficheiro Supervisor:

```bash
nano /etc/supervisor/conf.d/ademo.conf
```

Conteudo:

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
```

Activar:

```bash
supervisorctl reread
supervisorctl update
supervisorctl start ademo-queue
supervisorctl start ademo-scheduler
supervisorctl status
```

Ver logs:

```bash
tail -f /var/log/supervisor/ademo-queue.log
tail -f /var/log/supervisor/ademo-scheduler.log
```

---

## 12. Testes Sem Dominio

No backend:

```bash
cd /var/www/ademo/ademo-eleitoral-backend
php artisan migrate:status
php artisan route:list --path=api --except-vendor
php artisan queue:failed
php artisan elections:sync-statuses
```

Testar imagens de candidatos:

```bash
curl -I http://SEU_IP_DO_SERVIDOR:8080/candidate-photos/1
```

Testar e-mails:

1. Criar um utilizador com e-mail real.
2. Solicitar recuperacao de palavra-passe.
3. Criar/abrir/concluir uma eleicao de teste.
4. Confirmar se os e-mails chegaram.
5. Verificar falhas:

```bash
php artisan queue:failed
```

---

## 13. Actualizar o Sistema Depois de Alteracoes no Git

Sempre que fizer alteracoes no computador e enviar para o Git, no servidor execute:

```bash
cd /var/www/ademo
git pull origin main
```

Actualizar backend:

```bash
cd /var/www/ademo/ademo-eleitoral-backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
supervisorctl restart ademo-queue
supervisorctl restart ademo-scheduler
```

Actualizar frontend:

```bash
cd /var/www/ademo/ademo-eleitoral-frontend
npm install
npm run build
systemctl reload nginx
```

---

## 14. Quando Tiver Dominio

Quando comprar/configurar dominio, crie os DNS:

```text
Tipo A    seu-dominio.com       SEU_IP_DO_SERVIDOR
Tipo A    www.seu-dominio.com   SEU_IP_DO_SERVIDOR
Tipo A    api.seu-dominio.com   SEU_IP_DO_SERVIDOR
```

Aguarde a propagacao. Pode testar:

```bash
ping seu-dominio.com
ping api.seu-dominio.com
```

---

## 15. Alterar Backend Para Dominio

Editar `.env` do backend:

```bash
cd /var/www/ademo/ademo-eleitoral-backend
nano .env
```

Alterar:

```env
APP_URL=https://api.seu-dominio.com
FRONTEND_URL=https://seu-dominio.com
BROADCAST_CONNECTION=log
```

Se algum dia voltar a usar Reverb:

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=ademo
REVERB_APP_KEY=CHAVE_FORTE
REVERB_APP_SECRET=SECRET_FORTE
REVERB_HOST=api.seu-dominio.com
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

Aplicar:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

---

## 16. Alterar Frontend Para Dominio

Editar `.env.production`:

```bash
cd /var/www/ademo/ademo-eleitoral-frontend
nano .env.production
```

Conteudo:

```env
VITE_APP_NAME=Sistema Eleitoral ADEMO
VITE_API_URL=https://api.seu-dominio.com/api
```

Gerar novo build:

```bash
npm run build
```

---

## 17. Nginx Com Dominio

Editar configuracao:

```bash
nano /etc/nginx/sites-available/ademo
```

Conteudo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    root /var/www/ademo/ademo-eleitoral-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.seu-dominio.com;

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

Validar e recarregar:

```bash
nginx -t
systemctl reload nginx
```

---

## 18. Activar SSL Com Dominio

Instalar Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Gerar certificados:

```bash
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com -d api.seu-dominio.com
```

Testar renovacao:

```bash
certbot renew --dry-run
```

Depois do SSL, fechar a porta `8080` se ja nao estiver a ser usada:

```bash
ufw delete allow 8080/tcp
ufw allow 443/tcp
ufw status
```

---

## 19. Testes Com Dominio

Abrir no navegador:

```text
https://seu-dominio.com
```

Testar API:

```bash
curl -I https://api.seu-dominio.com/api
```

Testar fotografia:

```bash
curl -I https://api.seu-dominio.com/candidate-photos/1
```

Testar filas:

```bash
cd /var/www/ademo/ademo-eleitoral-backend
php artisan queue:failed
supervisorctl status
```

---

## 20. Checklist Final de Producao

Confirmar:

- `APP_ENV=production`.
- `APP_DEBUG=false`.
- `APP_KEY` definida.
- `APP_URL` correcto.
- `FRONTEND_URL` correcto.
- `VITE_API_URL` correcto antes do `npm run build`.
- Base de dados criada.
- Migrations executadas.
- SMTP real configurado.
- Queue Worker activo.
- Scheduler activo.
- Supervisor activo.
- `storage:link` executado.
- Permissoes de `storage` e `bootstrap/cache` correctas.
- Nginx activo.
- SSL activo quando tiver dominio.
- Porta `8080` fechada quando passar para dominio com `api.seu-dominio.com`.

---

## 21. Pontos Criticos

Sem Queue Worker:

- Os e-mails nao serao enviados.
- Notificacoes ficarao pendentes na fila.

Sem Scheduler:

- Eleicoes nao abrirao automaticamente.
- Eleicoes nao serao concluidas automaticamente.
- Avisos de eleicao prestes a terminar nao serao enviados.

Sem SMTP correcto:

- O sistema processara a fila, mas os e-mails nao chegarao.

Sem dominio:

- Pode usar o IP do servidor.
- Nao tera SSL facil.
- O sistema funciona, mas para producao real o ideal e usar dominio com HTTPS.

Sem `APP_DEBUG=false`:

- Dados sensiveis podem aparecer em erros publicos.

---

## 22. Docker

Docker e opcional neste projecto.

Use Docker se:

- O servidor ja tiver Docker instalado.
- Quiser subir backend, frontend, banco, queue e scheduler por containers.
- Souber gerir volumes, backups e logs dos containers.

Se nao quiser usar Docker, siga o guia normal acima. Para este projecto, hospedagem normal com Nginx, PHP-FPM, PostgreSQL e Supervisor e suficiente.
