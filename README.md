# Sistema Eleitoral ADEMO

Aplicação de gestão eleitoral com perfis de administração, comissão, fiscalização e eleitor. O backend expõe uma API Laravel; o frontend React consome essa API e usa Reverb para actualizações em tempo real quando configurado.

## Tecnologias e estrutura

- `ademo-eleitoral-backend/`: PHP 8.4, Laravel 13, Sanctum, Reverb e migrações para PostgreSQL.
- `ademo-eleitoral-frontend/`: React 19, Vite 8, Tailwind CSS e Axios.
- `docker-compose.prod.yml`: PostgreSQL, backend PHP, Nginx, fila, agendador, Reverb e frontend.

As versões exactas estão em `composer.lock` e `package-lock.json`.

## Desenvolvimento local

Requisitos: PHP 8.4 com extensões indicadas pelo Composer, Composer 2, Node.js compatível com Vite 8 e PostgreSQL.

1. Em `ademo-eleitoral-backend/`, execute `composer install`, copie `.env.example` para `.env`, configure a ligação PostgreSQL e execute `php artisan key:generate`.
2. Numa base de dados **local vazia**, execute `php artisan migrate`. Não execute `migrate:fresh` numa base com dados a preservar.
3. Inicie a API com `php artisan serve`. Se a porta 8000 estiver ocupada, use `php artisan serve --host=127.0.0.1 --port=8001`. Se usar eventos em tempo real, inicie também `php artisan reverb:start --host=0.0.0.0 --port=8080`.
4. Em `ademo-eleitoral-frontend/`, execute `npm ci`, copie `.env.example` para `.env` e execute `npm run dev` (no PowerShell com scripts bloqueados, use `npm.cmd`). Em desenvolvimento, `VITE_API_URL=/api` usa o proxy Vite; ajuste `ADEMO_BACKEND_DEV_URL` para a mesma porta da API. A compilação de produção precisa de `VITE_API_URL` com o endereço público correcto da API.

Os exemplos de ambiente não contêm credenciais reais. O frontend usa `VITE_API_URL` durante o build; configure a URL correcta antes de compilar. O backend requer `APP_KEY`, base de dados e, para email e Reverb, os respectivos serviços e segredos.

## Testes e build

```text
Backend:  php artisan test
Frontend: npm run lint
Frontend: npm run build
```

`/api/health` e `/up` verificam que a aplicação responde. Não substituem uma verificação de PostgreSQL, fila, SMTP e Reverb.

## Produção e dados

Leia [DEPLOY_DOCKER_PRODUCAO.md](DEPLOY_DOCKER_PRODUCAO.md) antes de configurar o ambiente. Use os ficheiros `.env.production.example` como referência, mantenha os ficheiros reais fora do repositório, defina `APP_DEBUG=false`, HTTPS, domínios e origens permitidas. A composição executa as migrações num serviço dedicado; crie e valide um backup antes de qualquer migração em dados reais.

Os novos documentos de candidatos são guardados em `storage/app/private/candidates/documents`. A API fornece ligações assinadas válidas por uma hora e o Nginx incluído bloqueia o caminho público antigo. Se a instalação já tiver documentos em `storage/app/public/candidates/documents`, faça backup, copie-os para o caminho privado, compare quantidades e hashes, teste os downloads e só então planeie a remoção dos originais públicos. Um servidor HTTP externo também deve impedir acesso directo ao caminho público. As fotografias dos candidatos continuam públicas.

O volume PostgreSQL e o volume `backend_storage` precisam de backups protegidos e de um ensaio de restauro. Não há evidência neste repositório de backups ou restauros já executados. Para uma eleição real, também são necessários testes de concorrência em PostgreSQL e uma revisão independente das garantias de sigilo e auditoria do voto; consulte a [auditoria de produção de 13 de novembro de 2026](AUDITORIA_PRODUCAO_2026-11-13.md).
