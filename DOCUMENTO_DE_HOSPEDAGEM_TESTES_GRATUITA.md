# Documento 2 - Hospedagem Gratuita Para Testes do Sistema ADEMO

Este documento e para a fase de testes do Sistema Eleitoral ADEMO.

Objectivo:

- Colocar o sistema online sem custos.
- Testar frontend, backend, base de dados, imagens e e-mails.
- Permitir demonstracao do sistema antes da hospedagem definitiva.

Este documento nao substitui o documento de producao. Para producao real, o ideal continua a ser servidor/VPS, dominio proprio, SSL, SMTP com dominio autenticado, queue worker e scheduler sempre activos.

---

## 1. Arquitectura Recomendada Para Testes Gratis

Para testar de forma gratuita, use servicos separados:

```text
Frontend React       -> Vercel ou Netlify
Backend Laravel      -> Servidor gratuito actual, Render, Koyeb ou outro host PHP
Base de dados        -> Neon ou Supabase PostgreSQL
E-mail SMTP          -> Brevo ou SMTP2GO
Imagens/Ficheiros    -> Storage local do backend, apenas para testes
Dominio              -> Subdominio gratis da plataforma
```

Exemplo de URLs:

```text
Frontend: https://sivo-ademo.mzx.app
Backend:  https://sivo-ademo-api.mzx.app
API:      https://sivo-ademo-api.mzx.app/api
```

Se a sua plataforma so tiver um link para tudo, tambem pode funcionar. Nesse caso, confirme no painel da hospedagem qual e o endereco publico da API.

---

## 2. O Que Pode Ser Gratis

Para testes, pode usar:

- Frontend: Vercel, Netlify ou Cloudflare Pages.
- Backend: o servidor gratuito que ja esta a usar, Render, Koyeb ou outro host gratuito com PHP.
- PostgreSQL: Neon ou Supabase.
- E-mail: Brevo ou SMTP2GO.
- Dominio: subdominio gratuito da plataforma.

Nao e necessario comprar dominio nesta fase.

---

## 3. Limitacoes Importantes da Hospedagem Gratis

Hospedagem gratuita normalmente tem limites:

- O servidor pode dormir quando fica algum tempo sem uso.
- O primeiro acesso pode demorar.
- Pode haver limite de memoria.
- Pode haver limite de build.
- Pode bloquear portas SMTP como `25`, `465` ou `587`.
- Pode nao permitir queue worker sempre ligado.
- Pode apagar ficheiros enviados quando faz redeploy.
- Pode nao permitir configurar SPF, DKIM e DMARC no subdominio gratuito.

Por isso, para testes e aceitavel. Para producao real, nao e recomendado depender apenas de hospedagem gratuita.

---

## 4. Preparar o Projecto no Git

No computador local:

```bash
git status
git add .
git commit -m "Preparar hospedagem gratuita de testes"
git push origin main
```

Se usa `master`:

```bash
git push origin master
```

Nao envie `.env` real para o Git.

---

## 5. Base de Dados Gratis Com Neon

1. Aceda a:

```text
https://neon.tech
```

2. Crie conta gratuita.
3. Crie um projecto PostgreSQL.
4. Copie os dados da ligacao:

```text
Host
Database
User
Password
Port
SSL mode
```

No `.env` do backend, configure:

```env
DB_CONNECTION=pgsql
DB_HOST=SEU_HOST_DO_NEON
DB_PORT=5432
DB_DATABASE=SEU_DATABASE
DB_USERNAME=SEU_USER
DB_PASSWORD=SUA_PASSWORD
DB_SSLMODE=require
```

Alternativa: Supabase.

```text
https://supabase.com
```

Use Supabase se preferir uma interface com tabela, autenticacao e storage. Para este projecto, Neon e mais simples para PostgreSQL puro.

---

## 6. E-mail Gratis Com Brevo

Brevo e uma boa opcao gratuita para testes.

1. Aceda a:

```text
https://www.brevo.com
```

2. Crie conta gratuita.
3. Verifique um e-mail remetente.
4. Va para SMTP/API.
5. Crie uma chave SMTP.
6. Copie:

```text
SMTP host
SMTP login
SMTP key/password
```

No `.env` do backend:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=2525
MAIL_USERNAME=SEU_LOGIN_SMTP_BREVO
MAIL_PASSWORD=SUA_CHAVE_SMTP_BREVO
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=EMAIL_VERIFICADO_NO_BREVO
MAIL_FROM_NAME="Sistema Eleitoral ADEMO"
```

Use primeiro a porta `2525`, porque muitos servidores gratuitos bloqueiam a porta `25` e por vezes tambem bloqueiam `587`.

Se `2525` nao funcionar, tente:

```env
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

Ou:

```env
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
```

---

## 7. Alternativa de E-mail Com SMTP2GO

Se Brevo nao funcionar por bloqueio da hospedagem, tente SMTP2GO.

1. Aceda a:

```text
https://www.smtp2go.com
```

2. Crie conta gratuita.
3. Crie credenciais SMTP.
4. Configure:

```env
MAIL_MAILER=smtp
MAIL_HOST=mail.smtp2go.com
MAIL_PORT=2525
MAIL_USERNAME=SEU_USUARIO_SMTP2GO
MAIL_PASSWORD=SUA_PASSWORD_SMTP2GO
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=EMAIL_VERIFICADO_NO_SMTP2GO
MAIL_FROM_NAME="Sistema Eleitoral ADEMO"
```

Se a porta `2525` falhar:

```env
MAIL_PORT=8025
MAIL_ENCRYPTION=tls
```

Se ainda falhar:

```env
MAIL_PORT=443
MAIL_ENCRYPTION=ssl
```

---

## 8. Configurar o Backend Para Testes

No painel da hospedagem do backend, configure as variaveis de ambiente.

Exemplo:

```env
APP_NAME="Sistema Eleitoral ADEMO"
APP_ENV=production
APP_KEY=base64:SUA_CHAVE
APP_DEBUG=false
APP_URL=https://URL_PUBLICA_DO_BACKEND
FRONTEND_URL=https://URL_PUBLICA_DO_FRONTEND

APP_LOCALE=pt
APP_FALLBACK_LOCALE=pt
APP_FAKER_LOCALE=pt_PT
APP_TIMEZONE=Africa/Maputo

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=SEU_HOST_DO_NEON
DB_PORT=5432
DB_DATABASE=SEU_DATABASE
DB_USERNAME=SEU_USER
DB_PASSWORD=SUA_PASSWORD
DB_SSLMODE=require

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
DB_QUEUE=default
DB_QUEUE_RETRY_AFTER=120
QUEUE_FAILED_DRIVER=database-uuids

MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=2525
MAIL_USERNAME=SEU_LOGIN_SMTP
MAIL_PASSWORD=SUA_CHAVE_SMTP
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=EMAIL_VERIFICADO
MAIL_FROM_NAME="Sistema Eleitoral ADEMO"

BROADCAST_CONNECTION=log
```

Se a hospedagem gratuita nao permitir queue worker, use temporariamente apenas para testes:

```env
QUEUE_CONNECTION=sync
```

Aviso:

- `QUEUE_CONNECTION=sync` envia os e-mails durante a request.
- Serve para teste gratuito.
- Nao e recomendado para producao.
- Para producao, volte para `QUEUE_CONNECTION=database` e use queue worker.

---

## 9. Comandos do Backend

Se a hospedagem permitir comandos ou terminal, execute:

```bash
cd ademo-eleitoral-backend
composer install --no-dev --optimize-autoloader
php artisan key:generate --show
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Se a plataforma pedir Build Command:

```bash
composer install --no-dev --optimize-autoloader && php artisan config:cache && php artisan route:cache && php artisan view:cache
```

Se a plataforma pedir Start Command:

```bash
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
```

Se a plataforma nao aceitar `${PORT:-8000}`, use:

```bash
php artisan serve --host=0.0.0.0 --port=$PORT
```

---

## 10. Migracoes em Hospedagem Gratuita

Algumas plataformas nao executam migrations automaticamente.

Opcoes:

1. Usar o terminal da propria plataforma e executar:

```bash
php artisan migrate --force
```

2. Se nao houver terminal, usar uma funcionalidade de "Deploy Command" ou "Post Deploy Command":

```bash
php artisan migrate --force
```

3. Se nenhuma das opcoes existir, use uma plataforma que permita terminal ou comandos de deploy. Laravel precisa disso para funcionar bem.

---

## 11. Queue Worker Para Testes

Melhor opcao, se a plataforma permitir background worker:

```bash
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60 --memory=256
```

Scheduler:

```bash
php artisan schedule:work
```

Se a plataforma gratuita nao permitir workers:

```env
QUEUE_CONNECTION=sync
```

E para testar abertura/encerramento automatico de eleicoes, execute manualmente quando possivel:

```bash
php artisan elections:sync-statuses
```

---

## 12. Configurar o Frontend

Pode hospedar o frontend gratis no Vercel ou Netlify.

### Vercel

1. Aceda a:

```text
https://vercel.com
```

2. Ligue a sua conta Git.
3. Importe o repositorio.
4. Configure:

```text
Root Directory: ademo-eleitoral-frontend
Build Command: npm run build
Output Directory: dist
```

5. Nas Environment Variables:

```env
VITE_APP_NAME=Sistema Eleitoral ADEMO
VITE_API_URL=https://URL_PUBLICA_DO_BACKEND/api
```

6. Fazer deploy.

### Netlify

1. Aceda a:

```text
https://www.netlify.com
```

2. Importar projecto do Git.
3. Configurar:

```text
Base directory: ademo-eleitoral-frontend
Build command: npm run build
Publish directory: ademo-eleitoral-frontend/dist
```

4. Variaveis:

```env
VITE_APP_NAME=Sistema Eleitoral ADEMO
VITE_API_URL=https://URL_PUBLICA_DO_BACKEND/api
```

---

## 13. CORS e URLs

No backend:

```env
APP_URL=https://URL_PUBLICA_DO_BACKEND
FRONTEND_URL=https://URL_PUBLICA_DO_FRONTEND
```

No frontend:

```env
VITE_API_URL=https://URL_PUBLICA_DO_BACKEND/api
```

Nunca use `localhost` em hospedagem.

Errado:

```env
APP_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000/api
```

Certo:

```env
APP_URL=https://sivo-ademo-api.exemplo.app
VITE_API_URL=https://sivo-ademo-api.exemplo.app/api
```

---

## 14. Imagens e Ficheiros em Hospedagem Gratuita

O sistema guarda fotografias dos candidatos em `storage/app/public`.

Em hospedagem gratuita, pode acontecer:

- As imagens funcionarem agora.
- Depois desaparecerem num novo deploy.
- O storage ser temporario.

Para testes, isto pode ser aceitavel.

Para evitar perda de imagens, opcoes futuras:

- Usar storage persistente da plataforma.
- Usar Cloudinary.
- Usar Supabase Storage.
- Usar S3 compativel.

Para producao, nao dependa de storage temporario.

---

## 15. Testar E-mail

Depois de configurar Brevo ou SMTP2GO, teste:

```bash
php artisan tinker
```

Dentro do tinker:

```php
Mail::raw('Teste de email do Sistema Eleitoral ADEMO.', function ($message) {
    $message->to('seu_email@gmail.com')->subject('Teste ADEMO');
});
```

Se usar filas:

```bash
php artisan queue:failed
```

Se houver falhas:

```bash
php artisan queue:retry all
```

---

## 16. Testar API

No navegador ou terminal:

```text
https://URL_PUBLICA_DO_BACKEND/api
```

Testar rotas:

```bash
php artisan route:list --path=api --except-vendor
```

Testar imagem de candidato:

```text
https://URL_PUBLICA_DO_BACKEND/candidate-photos/1
```

Se responder `404`, o candidato pode nao ter fotografia ou o ficheiro pode nao existir no storage da hospedagem.

---

## 17. Testar Fluxo Completo

Checklist:

- Abrir frontend.
- Fazer login.
- Criar membro.
- Criar eleicao.
- Registar candidato com imagem menor ou igual a 4 MB.
- Abrir votacao.
- Votar como eleitor.
- Confirmar e-mail de voto.
- Confirmar aviso de eleicao prestes a terminar.
- Confirmar encerramento/conclusao.
- Confirmar resultados.

---

## 18. Quando Comprar Dominio

Quando tiver dominio proprio, altere:

```env
APP_URL=https://api.seudominio.com
FRONTEND_URL=https://seudominio.com
VITE_API_URL=https://api.seudominio.com/api
MAIL_FROM_ADDRESS=notificacoes@seudominio.com
```

Depois configure no provedor de e-mail:

- SPF.
- DKIM.
- DMARC.

Isso ajuda muito a evitar spam.

Com subdominio gratuito como `mzx.app`, normalmente voce nao consegue configurar SPF/DKIM/DMARC do dominio principal. Por isso, para testes funciona, mas para e-mail profissional o ideal e dominio proprio.

---

## 19. Ordem Recomendada Para Fazer Agora

1. Manter o frontend no link gratuito actual ou colocar no Vercel.
2. Criar banco PostgreSQL gratis no Neon.
3. Configurar `.env` do backend com os dados do Neon.
4. Criar conta Brevo.
5. Verificar remetente no Brevo.
6. Configurar SMTP no `.env` do backend usando porta `2525`.
7. Alterar `APP_URL`, `FRONTEND_URL` e `VITE_API_URL` para URLs publicas.
8. Executar migrations.
9. Testar login.
10. Testar envio de e-mail.
11. Testar votacao completa.

---

## 20. Se o Servidor Bloquear E-mail

Tente nesta ordem:

1. Brevo na porta `2525`.
2. Brevo na porta `587`.
3. SMTP2GO na porta `2525`.
4. SMTP2GO na porta `8025`.
5. SMTP2GO na porta `443`.

Se nenhuma porta funcionar, a hospedagem gratuita esta a bloquear ligacoes SMTP externas. Nesse caso:

- Troque o backend para outra plataforma.
- Ou use um servidor/VPS.
- Ou use API HTTP de e-mail, mas isso exigiria alteracao no codigo.

---

## 21. Fontes Oficiais Uteis

- Vercel: `https://vercel.com`
- Netlify: `https://www.netlify.com`
- Neon: `https://neon.tech`
- Supabase: `https://supabase.com`
- Brevo: `https://www.brevo.com`
- SMTP2GO: `https://www.smtp2go.com`
- Cloudinary: `https://cloudinary.com`

---

## 22. Conclusao

Para testes gratuitos, a melhor combinacao e:

```text
Frontend: Vercel ou hospedagem actual
Backend: hospedagem actual gratuita
Base de dados: Neon PostgreSQL
E-mail: Brevo SMTP na porta 2525
Queue: database se houver worker; sync apenas se a plataforma gratuita nao suportar worker
Storage: local apenas para teste
```

Quando o sistema for para producao real, migrar para:

```text
Servidor/VPS
Dominio proprio
HTTPS
SMTP com SPF/DKIM/DMARC
Queue worker sempre activo
Scheduler sempre activo
Storage persistente
Backups automaticos
```
