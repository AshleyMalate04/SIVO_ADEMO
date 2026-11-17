# Documento 2 - Hospedagem Gratuita Para Testes do Sistema ADEMO

Actualizado em: 04/06/2026

Este documento explica como hospedar o Sistema Eleitoral ADEMO do zero, sem dominio proprio e sem configuracoes anteriores.

O objectivo e apenas testar o sistema online gratuitamente.

Neste guia vamos usar uma rota unica:

```text
GitHub  -> guardar o codigo do projecto
Neon    -> base de dados PostgreSQL gratis
Brevo   -> envio de e-mails gratis para testes
Render  -> backend Laravel/API
Vercel  -> frontend React
```

No fim, o sistema tera algo parecido com:

```text
Frontend: https://sistema-eleitoral-ademo.vercel.app
Backend:  https://ademo-backend.onrender.com
API:      https://ademo-backend.onrender.com/api
```

Importante:

- Nao precisa comprar dominio para esta fase.
- Nao precisa Docker instalado no seu computador.
- O backend usara o ficheiro `ademo-eleitoral-backend/Dockerfile.render`.
- O backend usa PHP 8.4 no container, porque as dependencias actuais exigem PHP 8.4 ou superior.
- No Render, o backend arranca com `docker/render-start.sh`, que abre a porta primeiro e executa migrations em segundo plano para evitar timeout no plano gratuito.
- Para testes gratuitos, vamos usar `QUEUE_CONNECTION=sync`, porque muitos planos gratuitos nao deixam workers sempre ligados.
- Para producao real, deve usar dominio proprio, HTTPS, SMTP autenticado, queue worker, scheduler e storage persistente.

---

## Antes de Comecar

Vai precisar de:

- Conta no GitHub.
- Conta no Neon.
- Conta no Brevo.
- Conta no Render.
- Conta no Vercel.
- O projecto actualizado no seu computador.

Tambem vai precisar guardar alguns dados num bloco de notas:

```text
APP_KEY=
URL_BACKEND=
URL_FRONTEND=
DB_HOST=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
```

Nao envie estes dados em mensagens publicas.

---

## Passo 1 - Colocar o Codigo no GitHub

### 1.1 Entrar no GitHub

1. Abra o navegador.
2. Aceda a:

```text
https://github.com
```

3. Clique em `Sign in`.
4. Entre com a sua conta.

### 1.2 Criar repositorio, se ainda nao existir

Se ja tem o projecto no GitHub, avance para o ponto `1.3`.

1. No GitHub, clique no botao `+` no canto superior direito.
2. Clique em `New repository`.
3. Em `Repository name`, escreva:

```text
sistema-eleitoral-ademo
```

4. Escolha `Private`, se nao quiser que outras pessoas vejam o codigo.
5. Nao marque `Add a README file`.
6. Clique em `Create repository`.
7. O GitHub vai mostrar uma URL do repositorio. Guarde essa URL.

No seu computador, dentro da pasta principal do projecto, execute:

```bash
git init
git add .
git commit -m "Primeira versao do Sistema Eleitoral ADEMO"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

Substitua `URL_DO_REPOSITORIO` pela URL que o GitHub mostrou.

### 1.3 Enviar alteracoes actuais para o GitHub

No seu computador, dentro da pasta principal do projecto:

```bash
git status
```

Se houver alteracoes:

```bash
git add .
git commit -m "Preparar hospedagem gratuita de testes"
git push origin main
```

Se a branch for `master`:

```bash
git push origin master
```

### 1.4 Confirmar no GitHub

1. Volte ao GitHub.
2. Actualize a pagina do repositorio.
3. Confirme se existem estas pastas:

```text
ademo-eleitoral-backend
ademo-eleitoral-frontend
```

4. Confirme se existe este ficheiro:

```text
ademo-eleitoral-backend/Dockerfile.render
```

Se esse ficheiro nao estiver no GitHub, faca `git add`, `commit` e `push` novamente.

---

## Passo 2 - Criar a Base de Dados no Neon

### 2.1 Entrar no Neon

1. Abra:

```text
https://neon.tech
```

2. Clique em `Sign Up` ou `Start for Free`.
3. Escolha `Continue with GitHub`, se aparecer.
4. Autorize o Neon.

### 2.2 Criar projecto

1. No painel do Neon, clique em `New Project`.
2. Preencha:

```text
Project name: ademo-eleitoral
Database name: ademo_eleitoral
Region: escolha uma regiao disponivel
```

3. Clique em `Create Project`.
4. Aguarde a criacao.

### 2.3 Copiar dados de ligacao

1. No dashboard do projecto, clique no botao preto `Connect`.
2. Vai abrir uma janela.
3. Procure por `Connection string`.
4. Se aparecer uma opcao de linguagem, escolha `Laravel`. Se nao aparecer, escolha `Postgres`.
5. Copie a connection string. Ela parece com:

```text
postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require
```

6. Procure tambem por `Connection details`, `Parameters` ou `Show password`.
7. Copie estes dados para um bloco de notas:

```text
DB_HOST=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
DB_PORT=5432
DB_SSLMODE=require
```

Exemplo:

```env
DB_CONNECTION=pgsql
DB_HOST=ep-alguma-coisa.region.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=SENHA_DO_NEON
DB_SSLMODE=require
```

Nao partilhe a senha.

Proximo passo: criar o e-mail no Brevo.

---

## Passo 3 - Configurar E-mail Gratis no Brevo

### 3.1 Entrar no Brevo

1. Abra:

```text
https://www.brevo.com
```

2. Clique em `Sign up free`.
3. Crie conta com e-mail ou Google.
4. Confirme o e-mail, se o Brevo pedir.
5. Entre no painel.

### 3.2 Verificar remetente

1. No menu, procure uma destas opcoes:

```text
Senders
Sender
Verified senders
Senders & IP
```

2. Clique em `Add a sender`.
3. Preencha:

```text
Name: Sistema Eleitoral ADEMO
Email: seu_email_real
```

Exemplo:

```text
Email: seuemail@gmail.com
```

4. Clique em guardar.
5. Se o Brevo enviar e-mail de confirmacao, abra a sua caixa de entrada.
6. Clique no link de confirmacao.
7. Volte ao Brevo.

### 3.3 Criar chave SMTP

1. No menu, procure:

```text
Transactional
SMTP & API
SMTP
```

2. Clique em `SMTP & API`.
3. Clique em `Generate a new SMTP key` ou `Create a new SMTP key`.
4. Nome da chave:

```text
ademo-testes
```

5. Copie:

```text
SMTP server
SMTP login
SMTP password/key
```

No Laravel usaremos:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=2525
MAIL_USERNAME=LOGIN_SMTP_BREVO
MAIL_PASSWORD=CHAVE_SMTP_BREVO
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=EMAIL_VERIFICADO_NO_BREVO
MAIL_FROM_NAME="Sistema Eleitoral ADEMO"
```

Use primeiro a porta `2525`.

Se nao funcionar, depois tente:

```env
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

ou:

```env
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
```

Proximo passo: gerar `APP_KEY`.

---

## Passo 4 - Gerar APP_KEY do Laravel

No seu computador:

1. Abra CMD, PowerShell ou terminal.
2. Entre na pasta do backend:

```bash
cd caminho/do/projecto/ademo-eleitoral-backend
```

No seu caso, normalmente sera algo parecido com:

```bash
cd C:\Users\user\Desktop\FACULDADE\TUDO_ESTAGIO\V8_FINAL_ACESSIBILIDADE\PROJECTO_ADEMO_V3\ademo-eleitoral-backend
```

3. Execute:

```bash
php artisan key:generate --show
```

4. Copie o resultado.

Exemplo:

```text
base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

Guarde como:

```env
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=
```

Proximo passo: criar o backend no Render.

---

## Passo 5 - Hospedar Backend Laravel no Render

### 5.1 Entrar no Render

1. Abra:

```text
https://render.com
```

2. Clique em `Sign Up` ou `Log In`.
3. Entre com GitHub.
4. Autorize o Render a aceder ao GitHub.

### 5.2 Criar Web Service

1. No painel do Render, clique em `New`.
2. Clique em `Web Service`.
3. Escolha `Build and deploy from a Git repository`.
4. Escolha o repositorio do Sistema ADEMO.
5. Clique em `Connect`.

### 5.3 Configurar Web Service

Preencha:

```text
Name: ademo-backend
Language/Environment/Runtime: Docker
Branch: main
Root Directory: ademo-eleitoral-backend
Dockerfile Path: Dockerfile.render
```

Se a sua branch for `master`, escolha `master`.

Muito importante:

- Nao deixe `Dockerfile Path` vazio.
- Nao use `Dockerfile` no Render.
- Use exactamente `Dockerfile.render`.
- Se os logs mostrarem `COPY docker/entrypoint.sh`, o Render esta a usar o `Dockerfile` errado.
- Se aparecer `No open ports detected`, confirme primeiro se `Dockerfile Path` esta como `Dockerfile.render`.
- Se mesmo com `Dockerfile.render` aparecer `Port scan timeout`, envie para o GitHub a versao que contem `docker/render-start.sh` e faca `Clear build cache & deploy`.

Em plano, escolha:

```text
Instance Type: Free
```

Se nao aparecer plano gratuito, a plataforma pode ter mudado as regras. Para testes gratuitos, procure outra hospedagem que aceite Docker/PHP, ou use a plataforma gratuita que ja tiver.

### 5.4 Adicionar variaveis de ambiente

No Render, procure:

```text
Environment
Environment Variables
Add Environment Variable
```

Adicione uma por uma:

```env
APP_NAME=Sistema Eleitoral ADEMO
APP_ENV=production
APP_KEY=COLE_A_APP_KEY_GERADA
APP_DEBUG=false
APP_URL=https://ademo-backend.onrender.com
FRONTEND_URL=https://frontend-ainda-nao-criado.vercel.app
APP_LOCALE=pt
APP_FALLBACK_LOCALE=pt
APP_FAKER_LOCALE=pt_PT
APP_TIMEZONE=Africa/Maputo
LOG_CHANNEL=stack
LOG_LEVEL=warning
DB_CONNECTION=pgsql
DB_HOST=HOST_DO_NEON
DB_PORT=5432
DB_DATABASE=DATABASE_DO_NEON
DB_USERNAME=USUARIO_DO_NEON
DB_PASSWORD=SENHA_DO_NEON
DB_SSLMODE=require
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=2525
MAIL_USERNAME=LOGIN_SMTP_BREVO
MAIL_PASSWORD=CHAVE_SMTP_BREVO
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=EMAIL_VERIFICADO_NO_BREVO
MAIL_FROM_NAME=Sistema Eleitoral ADEMO
BROADCAST_CONNECTION=log
```

Notas:

- `APP_URL` sera corrigido depois que o Render mostrar a URL real.
- `FRONTEND_URL` tambem sera corrigido depois que o frontend for criado no Vercel.
- `QUEUE_CONNECTION=sync` e apenas para testes gratuitos.
- No Neon, use primeiro a ligacao normal/directa com `DB_PORT=5432`.
- Se copiou uma ligacao com host contendo `-pooler` e porta `5433`, e der timeout no Render, volte ao Neon e copie a connection string normal, sem pooler, usando porta `5432`.

### 5.5 Criar e aguardar deploy

1. Clique em `Create Web Service`.
2. Aguarde o deploy.
3. Clique na aba `Logs`.
4. Espere aparecer que o servidor iniciou.

O Render vai mostrar uma URL parecida com:

```text
https://ademo-backend.onrender.com
```

Copie essa URL.

### 5.6 Corrigir APP_URL no Render

1. No Render, abra o servico `ademo-backend`.
2. Va em `Environment`.
3. Corrija:

```env
APP_URL=https://URL_REAL_DO_BACKEND
```

4. Clique em `Save Changes`.
5. Clique em `Manual Deploy`.
6. Clique em `Deploy latest commit`.

### 5.7 Testar backend

Abra no navegador:

```text
https://URL_REAL_DO_BACKEND
```

Depois teste:

```text
https://URL_REAL_DO_BACKEND/api
```

Se `/api` mostrar `404`, nao significa necessariamente erro. O mais importante e o frontend conseguir fazer login e chamar a API.

Proximo passo: hospedar o frontend no Vercel.

---

## Passo 6 - Hospedar Frontend React no Vercel

### 6.1 Entrar no Vercel

1. Abra:

```text
https://vercel.com
```

2. Clique em `Sign Up` ou `Log In`.
3. Entre com GitHub.
4. Autorize a Vercel.

### 6.2 Importar projecto

1. No painel da Vercel, clique em `Add New`.
2. Clique em `Project`.
3. Escolha o repositorio do Sistema ADEMO.
4. Clique em `Import`.

### 6.3 Configurar projecto

Preencha:

```text
Framework Preset: Vite
Root Directory: ademo-eleitoral-frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 6.4 Configurar variaveis do frontend

Procure `Environment Variables`.

Adicione:

```env
VITE_APP_NAME=Sistema Eleitoral ADEMO
VITE_API_URL=https://URL_REAL_DO_BACKEND/api
VITE_REALTIME_ENABLED=false
```

Exemplo:

```env
VITE_API_URL=https://ademo-backend.onrender.com/api
```

### 6.5 Fazer deploy

1. Clique em `Deploy`.
2. Aguarde terminar.
3. A Vercel vai mostrar uma URL parecida com:

```text
https://sistema-eleitoral-ademo.vercel.app
```

4. Copie essa URL.

Proximo passo: voltar ao Render e corrigir `FRONTEND_URL`.

---

## Passo 7 - Ligar Frontend e Backend

### 7.1 Corrigir FRONTEND_URL no Render

1. Volte ao Render.
2. Abra o servico do backend.
3. Va em `Environment`.
4. Corrija:

```env
FRONTEND_URL=https://URL_REAL_DO_FRONTEND
```

Exemplo:

```env
FRONTEND_URL=https://sistema-eleitoral-ademo.vercel.app
```

5. Clique em `Save Changes`.
6. Clique em `Manual Deploy`.
7. Clique em `Deploy latest commit`.

### 7.2 Confirmar VITE_API_URL no Vercel

1. Volte ao Vercel.
2. Abra o projecto do frontend.
3. Va em `Settings`.
4. Va em `Environment Variables`.
5. Confirme:

```env
VITE_API_URL=https://URL_REAL_DO_BACKEND/api
```

6. Se alterou alguma coisa, faca novo deploy:

```text
Deployments -> tres pontos no ultimo deploy -> Redeploy
```

Para esta fase gratuita de testes, deixe Reverb/WebSocket desligado no Vercel:

```env
VITE_REALTIME_ENABLED=false
```

Nao coloque estas variaveis enquanto nao tiver Reverb publicado:

```env
VITE_REVERB_APP_KEY
VITE_REVERB_HOST
VITE_REVERB_PORT
VITE_REVERB_SCHEME
```

---

## Passo 8 - Testar o Sistema

### 8.1 Testar abertura

1. Abra a URL do frontend.
2. A tela de login deve aparecer.

### 8.2 Testar login

1. Tente entrar com um utilizador valido.
2. Se der erro, abra o Console do navegador:

```text
F12 -> Console
```

3. Se aparecer erro de `CORS`, corrija `FRONTEND_URL` no Render.
4. Se aparecer erro de API, corrija `VITE_API_URL` no Vercel.

### 8.3 Testar base de dados

No Render:

1. Abra o backend.
2. Clique em `Logs`.
3. Procure mensagens de `migrate`.

Se houver erro de base de dados:

1. Volte ao Neon.
2. Clique em `Connect`.
3. Copie novamente os dados.
4. Corrija no Render:

```env
DB_HOST
DB_DATABASE
DB_USERNAME
DB_PASSWORD
DB_SSLMODE=require
```

5. Faca novo deploy.

### 8.4 Testar e-mail

No sistema:

1. Crie um utilizador com e-mail real.
2. Use recuperacao de palavra-passe.
3. Veja se o e-mail chegou.

Se nao chegar:

1. Abra `Logs` no Render.
2. Confirme no Render:

```env
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=2525
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=...
```

3. Se a porta `2525` falhar, tente:

```env
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

4. Se ainda falhar:

```env
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
```

5. Faca novo deploy/restart do backend.

### 8.5 Testar votacao

1. Criar membro.
2. Criar eleicao.
3. Registar candidato.
4. Enviar imagem menor ou igual a 4 MB.
5. Abrir eleicao.
6. Votar como eleitor.
7. Confirmar e-mail de voto.
8. Concluir eleicao.
9. Publicar resultados, se existir essa accao no fluxo.

### 8.6 Testar imagens

1. Abra detalhes do candidato.
2. Veja se a fotografia aparece.
3. Abra boletim de voto.
4. Veja se a fotografia aparece.

Tambem pode testar no navegador:

```text
https://URL_REAL_DO_BACKEND/candidate-photos/1
```

Se der `404`:

- O candidato pode nao ter fotografia.
- O ficheiro pode nao existir.
- A hospedagem gratuita pode ter apagado storage no redeploy.

---

## Passo 9 - Erros Comuns

### Erro: APP_KEY missing

Gere:

```bash
php artisan key:generate --show
```

Coloque no Render:

```env
APP_KEY=base64:...
```

### Erro: Dockerfile nao encontrado no Render

Confirme:

```text
Root Directory: ademo-eleitoral-backend
Dockerfile Path: Dockerfile.render
```

Se colocou:

```text
ademo-eleitoral-backend/Dockerfile.render
```

troque para:

```text
Dockerfile.render
```

Se nos logs aparecer:

```text
COPY docker/entrypoint.sh
No open ports detected
CMD ["php-fpm"]
```

significa que o Render esta a usar o `Dockerfile` normal, nao o `Dockerfile.render`.

Corrija em:

```text
Render -> backend -> Settings -> Build & Deploy -> Dockerfile Path
```

Coloque:

```text
Dockerfile.render
```

Depois clique em:

```text
Manual Deploy -> Clear build cache & deploy
```

### Erro: frontend chama localhost

No Vercel, corrija:

```env
VITE_API_URL=https://URL_REAL_DO_BACKEND/api
```

Depois faca redeploy do frontend.

Se no Console aparecer:

```text
POST http://127.0.0.1:8000/api/auth/login net::ERR_CONNECTION_REFUSED
```

significa que `VITE_API_URL` nao foi configurado no Vercel ou foi configurado depois do deploy sem redeploy.

Corrija em:

```text
Vercel -> Project -> Settings -> Environment Variables
```

Adicione:

```env
VITE_API_URL=https://URL_REAL_DO_BACKEND/api
VITE_REALTIME_ENABLED=false
```

Depois faca:

```text
Deployments -> tres pontos -> Redeploy
```

### Erro: WebSocket tenta ligar em :8080

Se aparecer:

```text
WebSocket connection to 'wss://...vercel.app:8080/app/ademo_key...' failed
```

significa que o frontend foi publicado com configuracao antiga de Reverb/WebSocket.

Para testes gratuitos, deixe:

```env
VITE_REALTIME_ENABLED=false
```

E remova/desactive no Vercel:

```env
VITE_REVERB_APP_KEY
VITE_REVERB_HOST
VITE_REVERB_PORT
VITE_REVERB_SCHEME
```

Depois faca redeploy do frontend.

### Erro: reload em /login da 404 no Vercel

Se ao actualizar a pagina aparecer:

```text
GET https://seu-projecto.vercel.app/login 404
```

o Vercel precisa de uma regra para React Router.

O projecto deve ter este ficheiro:

```text
ademo-eleitoral-frontend/vercel.json
```

Com:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Depois envie para o GitHub e faca novo deploy no Vercel.

### Erro: CORS

No Render, corrija:

```env
FRONTEND_URL=https://URL_REAL_DO_FRONTEND
```

Depois faca redeploy do backend.

Se o erro mostrar uma chamada assim:

```text
https://ademo-backend.onrender.com/auth/login
```

o problema tambem esta no Vercel: falta `/api` em `VITE_API_URL`.

No Vercel, o correcto e:

```env
VITE_API_URL=https://ademo-backend.onrender.com/api
```

O resultado esperado na chamada de login e:

```text
https://ademo-backend.onrender.com/api/auth/login
```

Depois faca redeploy do frontend.

### Erro: base de dados nao liga

No Neon:

```text
Dashboard -> Connect
```

Copie outra vez:

```env
DB_HOST
DB_DATABASE
DB_USERNAME
DB_PASSWORD
```

No Render, confirme:

```env
DB_SSLMODE=require
```

Se o erro mencionar porta `5433`, como:

```text
Port: 5433
timeout expired
```

faca isto:

1. Volte ao Neon.
2. Clique em `Connect`.
3. Procure a connection string normal/directa, nao a pooled/pooler.
4. Se houver uma opcao chamada `Pooled connection`, desligue essa opcao.
5. Copie novamente os dados.
6. No Render, coloque:

```env
DB_PORT=5432
```

7. Se o host tiver `-pooler`, tente usar o host sem `-pooler`.

Exemplo:

```env
DB_HOST=ep-divine-dew-aqsg8a8b.c-8.us-east-1.aws.neon.tech
DB_PORT=5432
```

em vez de:

```env
DB_HOST=ep-divine-dew-aqsg8a8b-pooler.c-8.us-east-1.aws.neon.tech
DB_PORT=5433
```

### Erro: e-mail nao envia

Tente nesta ordem:

```text
Brevo 2525 tls
Brevo 587 tls
Brevo 465 ssl
SMTP2GO 2525 tls
SMTP2GO 8025 tls
SMTP2GO 443 ssl
```

### Erro: e-mails demorados ou request lenta

Isto pode acontecer porque em testes usamos:

```env
QUEUE_CONNECTION=sync
```

Para producao, deve usar:

```env
QUEUE_CONNECTION=database
```

e um worker:

```bash
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60 --memory=256
```

### Erro: imagens desaparecem depois de redeploy

Hospedagem gratuita pode ter storage temporario.

Para testes, e aceitavel.

Para producao, use:

- Storage persistente da plataforma.
- Cloudinary.
- Supabase Storage.
- S3 compativel.

---

## Checklist Final

Confirme:

```text
GitHub tem o codigo actualizado.
Neon tem base de dados criada.
Brevo tem remetente verificado.
Brevo tem SMTP key criada.
Render tem backend criado.
Render usa Dockerfile.render.
Render tem APP_KEY.
Render tem dados do Neon.
Render tem dados SMTP do Brevo.
Render tem APP_URL correcto.
Render tem FRONTEND_URL correcto.
Vercel tem frontend criado.
Vercel tem VITE_API_URL correcto.
Frontend abre.
Login funciona.
Imagem do candidato aparece.
E-mail chega.
Votacao funciona.
```

---

## Quando Tiver Dominio Proprio

Depois, quando comprar dominio:

Backend:

```env
APP_URL=https://api.seudominio.com
FRONTEND_URL=https://seudominio.com
```

Frontend:

```env
VITE_API_URL=https://api.seudominio.com/api
```

E-mail:

```env
MAIL_FROM_ADDRESS=notificacoes@seudominio.com
```

No provedor de e-mail, configure:

```text
SPF
DKIM
DMARC
```

Isso ajuda a reduzir spam.

---

## Links Oficiais

- GitHub: `https://github.com`
- Neon: `https://neon.tech`
- Brevo: `https://www.brevo.com`
- Render: `https://render.com`
- Vercel: `https://vercel.com`
- SMTP2GO: `https://www.smtp2go.com`
- Cloudinary: `https://cloudinary.com`
- Supabase: `https://supabase.com`
