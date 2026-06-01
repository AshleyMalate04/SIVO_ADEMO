# Correcções Gerais ADEMO — V2

## Principais melhorias aplicadas

### 1. Língua portuguesa e acentuação
- Corrigidas várias mensagens visíveis para português de Portugal/pre-AO: eleição, órgão, delegação, acção, configurações, código, descrição, início, votação, entre outras.
- Mantidas as rotas técnicas sem acentuação para não quebrar o React Router.

### 2. Interface profissional
- Melhorias globais na UI: cartões com sombra, tabelas com hover, áreas de detalhe mais claras, página de resultados mais profissional, cards de vencedor, layout de consulta melhorado e melhor hierarquia visual.
- As notificações continuam padronizadas com `sonner` no canto superior direito.

### 3. Configurações e palavra-passe
- Corrigido o fluxo de alteração de palavra-passe.
- O backend agora grava a nova palavra-passe com `Hash::make()` explicitamente.
- Melhoradas mensagens da página de Configurações.

### 4. Comissão, fiscal e membros
- Na criação de utilizadores operacionais, a coluna/campo de palavra-passe foi removida do formulário.
- A palavra-passe inicial passa a ser `12345678` por padrão no backend.
- Se o utilizador tiver email, o sistema tenta enviar uma mensagem com código de acesso e palavra-passe inicial.
- Ao criar um membro, o backend cria também uma conta de eleitor ligada ao `member_code`, com palavra-passe inicial `12345678`.
- O membro continua a votar apenas nas eleições onde for autorizado como eleitor.

### 5. Resultados presenciais e publicação
- Melhorado o fluxo de resultados presenciais.
- Quando a eleição estiver `CONCLUIDA`, a comissão pode inserir resultados presenciais por candidato e votos em branco.
- Depois pode aprovar os resultados presenciais.
- Só depois pode publicar resultados finais.
- Após publicação, a acção principal passa a ser consulta do resultado final.
- Auditoria regista criação de contas, envio de credenciais, registo de resultados presenciais, aprovação e publicação.

### 6. Página de resultados
- Substituídos dados simulados por dados vindos da API.
- A página agora mostra votos online, presenciais, votos em branco, total e candidato mais votado.
- Criada página de detalhes de resultado com apuramento real.

### 7. Paginação
- A paginação só aparece quando houver mais de 7 registos.
- O resumo continua visível para indicar quantos registos estão a ser mostrados.

### 8. Selects e dados activos
- Mantida a regra: entidades inactivas/desactivadas não aparecem em selects de registo.
- As telas de registo de eleição, equipa, candidatos e eleitores continuam a filtrar dados activos e eleições `PROGRAMADA` quando necessário.

## Comandos depois de extrair

### Backend
```bash
cd ademo-eleitoral-backend
composer install
php artisan optimize:clear
php artisan migrate
php artisan serve
```

### Frontend
```bash
cd ademo-eleitoral-frontend
npm install
npm run dev
```

## Verificações realizadas
- `npm run build`: OK.
- `php -l` em todos os ficheiros PHP dentro de `app/`: OK.
- Não foi possível executar `php artisan route:list` neste ambiente porque o ZIP não inclui `vendor/`. No teu computador, depois de `composer install`, podes executar normalmente.
