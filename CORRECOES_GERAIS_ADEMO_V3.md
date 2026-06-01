# Correcções Gerais ADEMO — V3

Esta versão concentra-se em responsividade, usabilidade, notificações e actualizações em tempo real.

## 1. Responsividade e usabilidade

- O conteúdo principal passou a ocupar a largura disponível do `main`.
- O menu lateral ficou menor no desktop e transformou-se em menu móvel em tablets/telemóveis.
- As tabelas passaram a adaptar-se em ecrãs pequenos, aparecendo em formato de cartões com rótulos por coluna.
- Formulários, filtros, cards, resultados e detalhes passaram a usar grelhas flexíveis.
- Botões principais ocupam a largura necessária em ecrãs pequenos.
- A página passa a funcionar melhor em computador, tablet e telemóvel.

## 2. Notificações funcionais

A página de notificações deixou de usar dados falsos e agora consulta a API:

- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/{id}/read`
- `DELETE /api/notifications/{id}`

Foram previstos avisos para:

- início da votação;
- votação prestes a terminar, cerca de 2 horas antes;
- eleição concluída;
- resultados publicados.

## 3. Actualizações em tempo real

Foram preparados eventos de broadcast:

- `NotificacaoCriada`
- `ParticipacaoActualizada`
- `ResultadoPublicado`
- `EleicaoEstadoActualizado`

O frontend já tem:

- `src/lib/echo.js`
- `src/hooks/useRealtimeNotifications.js`
- `src/hooks/useElectionRealtime.js`

O sistema também mantém fallback com actualização periódica, por isso continua funcional mesmo sem Reverb activo.

## 4. Laravel Reverb

Para activar comunicação real em tempo real, no backend execute:

```bash
composer require laravel/reverb
php artisan install:broadcasting
php artisan reverb:install
php artisan migrate
```

No `.env` do backend:

```env
BROADCAST_CONNECTION=reverb
QUEUE_CONNECTION=database

REVERB_APP_ID=ademo
REVERB_APP_KEY=ademo_key
REVERB_APP_SECRET=ademo_secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
```

No `.env` do frontend:

```env
VITE_REVERB_APP_KEY=ademo_key
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Depois inicie em terminais separados:

```bash
php artisan serve
php artisan queue:work
php artisan reverb:start
npm run dev
```

## 5. Auditoria e resultados

- Ao registar voto online, é disparada actualização de resultados.
- Ao registar/aprovar resultados presenciais, é disparada actualização de resultados.
- Ao publicar resultados, os eleitores e equipa da eleição são notificados.
- A auditoria continua a registar acções críticas.

## 6. Validação feita

- `npm run build`: OK
- `php -l` nos ficheiros PHP de `app/`, `database/` e `routes/`: OK

## 7. Pastas não incluídas no ZIP

Por segurança e tamanho, não foram incluídas:

- `.env`
- `vendor/`
- `node_modules/`
- `.git/`
- `dist/`

Recrie com:

```bash
cd ademo-eleitoral-backend
composer install
php artisan optimize:clear
php artisan migrate
php artisan serve
```

```bash
cd ademo-eleitoral-frontend
npm install
npm run dev
```
