# Correcções Gerais ADEMO — V5

Esta versão corrige os pontos reportados depois dos testes da V4.

## 1. Palavra-passe de primeiro acesso

Foi corrigido o problema em que o sistema obrigava o utilizador a alterar a palavra-passe sempre que entrava com `12345678`.

Agora o sistema não decide pelo valor digitado. Ele usa o novo campo:

- `users.password_changed_at`

Regra actual:

- se `password_changed_at` estiver vazio, o sistema considera primeiro acesso;
- quando o utilizador define a palavra-passe uma vez, mesmo que escolha `12345678`, o campo é preenchido;
- depois disso, o sistema deixa de pedir alteração de palavra-passe.

Execute:

```bash
php artisan migrate
```

## 2. Configurações e alteração de palavra-passe

Foram removidas as mensagens inline por baixo dos campos. Agora a página usa apenas cards/toasts.

Também foi reforçada a resposta do backend para evitar falso erro depois da palavra-passe ter sido gravada.

## 3. Portal do eleitor

O eleitor continua a ver apenas eleições em que foi autorizado a participar.

Filtros disponíveis no portal:

- Todas
- Programada
- Em votação
- Concluída
- Resultados publicados
- Participei

Quando o eleitor já votou, o botão de participação permanece desactivado.

## 4. Resultados

Foram aplicadas regras de permissão:

- eleitor vê apenas resultados das eleições em que foi autorizado;
- comissão/fiscal vê apenas resultados das eleições em que foi seleccionado para gerir/fiscalizar;
- administrador vê todas.

Na página de resultados, aparecem primeiro 3 eleições. O botão `Ver todas` expande a lista.

## 5. Auditoria

A tabela de auditoria foi melhorada:

- removeu-se a coluna IP da tabela principal;
- adicionou-se botão para ver detalhes;
- detalhes foram traduzidos para linguagem mais compreensível;
- a data passou a usar `created_at` ou `updated_at` como fallback para evitar `Sem data`.

## 6. Modais

A classe `modal-overlay` foi reforçada para preencher toda a tela, tal como o preview de imagem.

## 7. Notificações

O serviço de notificações foi melhorado para localizar eleitores também por:

- código de membro;
- email;
- telefone.

Assim, quando a eleição inicia, está prestes a terminar, é concluída ou tem resultados publicados, os eleitores autorizados recebem melhor as notificações.

## 8. Responsividade do menu do eleitor

O menu inferior do eleitor no telemóvel foi ajustado para preencher a largura toda e sem cantos arredondados estranhos.

## Comandos recomendados

Backend:

```bash
composer install
php artisan optimize:clear
php artisan migrate
php artisan storage:link
php artisan serve
```

Frontend:

```bash
npm install
npm run dev
```

## Validação feita

- PHP syntax check: OK
- npm run build: OK
