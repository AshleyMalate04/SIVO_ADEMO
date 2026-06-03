# Sistema Eleitoral ADEMO - Documentação Consolidada

## Visão Geral

O Sistema Eleitoral ADEMO é composto por uma API Laravel e um frontend React para gestão de eleições, membros, equipas eleitorais, eleitores autorizados, votação, resultados, auditoria, notificações internas em tempo real e notificações por e-mail.

## Arquitectura

- Backend: Laravel, Sanctum, Reverb, filas em base de dados e PostgreSQL.
- Frontend: React, Vite e integração em tempo real via Echo/Reverb.
- Produção: Docker Compose com serviços para backend PHP-FPM, Nginx, PostgreSQL, queue worker, scheduler, Reverb e frontend.
- Notificações: tabela interna `notifications` para a aplicação e Laravel Notifications para e-mail.

## Notificações

As notificações internas continuam a ser guardadas na tabela `notifications` e transmitidas em tempo real pelo evento `NotificacaoCriada`.

As notificações por e-mail usam Laravel Notifications, Blade Mail Templates e filas obrigatórias. Nenhum envio de e-mail deve ocorrer de forma síncrona.

Eventos actualmente cobertos:

- Criação de nova eleição: admins activos recebem notificação.
- Abertura de eleição: audiência autorizada recebe notificação.
- Encerramento de eleição: audiência autorizada recebe notificação.
- Publicação de resultados: audiência autorizada recebe notificação.
- Alteração manual de estado de eleição: audiência autorizada recebe notificação.
- Eleição prestes a terminar: aviso aos 30 minutos quando a duração é superior a 30 minutos; caso contrário, aviso aos 15 minutos.
- Confirmação de voto: eleitor recebe notificação com código do comprovativo.
- Alteração de palavra-passe: utilizador recebe notificação de segurança.
- Acesso inicial e recuperação de palavra-passe: e-mails enviados por fila com templates Blade.

Filas usadas:

- `notifications`: fan-out e criação de notificações internas.
- `mail`: envio de e-mails.
- `default`: fallback operacional.

## Melhorias Implementadas

- Adicionados jobs `SendUserNotificationJob`, `SendElectionAudienceNotificationJob` e `SendRoleNotificationJob`.
- Adicionada notification `AdemoEmailNotification` com `ShouldQueue`, retry, timeout e backoff.
- Adicionado mailable `PasswordResetCodeMail` com fila.
- Convertido `InitialAccessMail` para `ShouldQueue`.
- Substituído HTML inline de recuperação de senha por Blade templates.
- Criado layout profissional reutilizável para e-mails.
- Removido envio síncrono com `Mail::send`/`Mail::html`.
- Adicionado serviço `scheduler` ao Docker Compose de produção.
- Reforçado `queue:work` com filas explícitas, retry, timeout, backoff, memória e max-time.
- Adicionado rate limiting em login e recuperação de senha.
- Removida sincronização de eleições de requests HTTP; agora é responsabilidade do scheduler.
- Corrigido aviso de eleição prestes a terminar para 30/15 minutos.
- Reduzido trabalho repetido da sincronização automática.
- Adicionados índices de produção para notificações, eleições, eleitores, equipas, membros e utilizadores.
- Protegida ordenação dinâmica contra colunas inválidas em listagens.
- Corrigida formatação de rotas desalinhadas.

## Problemas Identificados e Corrigidos

- E-mails eram enviados de forma síncrona em fluxos críticos.
- Recuperação de senha usava HTML inline, pouco reutilizável e difícil de manter.
- Sincronização de estado de eleições corria dentro de requests HTTP.
- Scheduler não existia no Docker Compose de produção.
- Aviso de término estava fixo em 2 horas, divergindo da regra de negócio.
- Query de audiência da eleição carregava colecções em memória antes de localizar utilizadores.
- Filtros e listagens importantes não tinham índices suficientes.
- `sort_by` aceitava colunas arbitrárias em algumas listagens.
- Endpoints de autenticação não tinham rate limiting explícito.
- Havia duplicação de agendamento do comando de sincronização.

## Recomendações de Produção

- Configurar SMTP real ou provider transaccional dedicado.
- Manter `QUEUE_CONNECTION=database` ou migrar para Redis se o volume crescer.
- Executar sempre queue workers para `notifications,mail,default`.
- Executar sempre o scheduler.
- Monitorizar `failed_jobs` diariamente.
- Usar `php artisan queue:failed`, `queue:retry` e alertas de logs para falhas críticas.
- Configurar `APP_DEBUG=false`, segredos fortes e `LOG_LEVEL=warning` em produção.
- Considerar Laravel Horizon se a fila migrar para Redis.
- Adicionar métricas de entrega de e-mail se houver auditoria formal de comunicação.

## Comandos Úteis

```bash
php artisan migrate --force
php artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60
php artisan schedule:work
php artisan queue:failed
php artisan queue:retry all
```

## Exemplo de Supervisor

```ini
[program:ademo-queue]
command=php /var/www/ademo-eleitoral-backend/artisan queue:work --queue=notifications,mail,default --sleep=3 --tries=3 --timeout=90 --backoff=60 --memory=256
directory=/var/www/ademo-eleitoral-backend
autostart=true
autorestart=true
stopwaitsecs=120
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/supervisor/ademo-queue.log

[program:ademo-scheduler]
command=php /var/www/ademo-eleitoral-backend/artisan schedule:work
directory=/var/www/ademo-eleitoral-backend
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/supervisor/ademo-scheduler.log
```

## Validação Realizada

- `php -l` nos ficheiros PHP alterados.
- `php artisan test`: 2 testes passaram.
- `php artisan route:list --path=api --except-vendor`: rotas carregadas com sucesso.
- `php artisan migrate --pretend`: migration de índices validada.
