# Correcções Gerais ADEMO — V4

Esta versão corrige os pontos pedidos após os testes com o perfil de eleitor, resultados, detalhes, imagem do candidato, palavra-passe e usabilidade.

## 1. Eleitor

- O eleitor passa a ver apenas as eleições em que foi autorizado a participar.
- O botão **Participar** fica desactivado quando o eleitor já votou.
- Foi adicionado o filtro **Participei / Por participar** no portal do eleitor.
- O eleitor pode consultar resultados das eleições autorizadas nos estados:
  - PROGRAMADA
  - EM_VOTACAO
  - CONCLUIDA
  - RESULTADOS_PUBLICADOS
- A equipa da eleição deixa de aparecer na área do eleitor.

## 2. Resultados

- O endpoint de resultados passa a permitir ao eleitor consultar resultados das suas eleições autorizadas, mesmo antes da publicação final.
- O eleitor vê apenas a lista de eleições e a secção de resultados parciais.
- Foram removidos, para o eleitor, os cards de total, votos online, presenciais e votos em branco.
- Foi removido, para o eleitor, o texto `Online: x · Presencial: y` nas barras de resultados.
- O card de votos online foi renomeado para **Votos online (válidos)** para diferenciar dos votos em branco.
- Ao seleccionar uma eleição na página de resultados, a página desce automaticamente para a secção de resultados.

## 3. Palavra-passe

- Corrigido o falso erro ao actualizar a palavra-passe quando a alteração já tinha sido gravada.
- No primeiro acesso com a senha inicial `12345678`, o utilizador é encaminhado para a página de definição de palavra-passe.
- A página de nova palavra-passe agora também suporta o primeiro acesso autenticado.

## 4. Candidatos

- A página de detalhes do candidato mostra a fotografia real quando existir.
- Ao clicar na fotografia, ela abre em tamanho maior.
- O botão de documento fica desactivado quando não houver documento.
- Quando houver documento, o sistema tenta abrir o ficheiro.
- O backend aceita ficheiros de foto e documento através de upload.

> Para as imagens/documentos funcionarem no Laravel, execute no backend:
>
> ```bash
> php artisan storage:link
> ```

## 5. Backend

- `VotingController` passou a validar a autorização do eleitor pelo utilizador autenticado, e não apenas pelo `member_id` enviado no frontend.
- `ResultController` passou a validar se o eleitor está autorizado antes de mostrar resultados.
- `ElectionController` remove dados da equipa quando quem consulta é eleitor.
- `SettingController` ficou idempotente para evitar falso erro em duplo envio.
- `CandidateController` passou a guardar `photo_file` e `document_file` em `storage/app/public`.

## 6. UI e usabilidade

- Aumentada a legibilidade das páginas de detalhes de eleição, candidato e resultado.
- Selects e elementos clicáveis passam a ter cursor `pointer`.
- Botões desactivados mostram comportamento visual adequado.
- Melhoria visual no modal de imagem do candidato.

## 7. Testes realizados no ambiente de correcção

- PHP syntax check nos controllers/models alterados: OK.
- `npm install`: OK.
- `npm run build`: OK.

## 8. Comandos recomendados após extrair

Backend:

```bash
cd ademo-eleitoral-backend
composer install
php artisan optimize:clear
php artisan migrate
php artisan storage:link
php artisan serve
```

Frontend:

```bash
cd ademo-eleitoral-frontend
npm install
npm run dev
```
