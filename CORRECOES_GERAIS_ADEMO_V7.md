# ADEMO — Correcções V7

Esta versão corrige problemas de auditoria, filtros, estados, modais, configurações, selects e apresentação em português.

## 1. Auditoria

- O filtro de tipo e o filtro de data foram corrigidos.
- Foram removidos da visualização principal os registos repetitivos de início e fim de sessão.
- A tabela deixou de expor IP na vista principal.
- A coluna Entidade passa a apresentar nomes mais compreensíveis, por exemplo: `Eleição: Assembleia Geral` ou `Candidato: Nome do membro`.
- A descrição evita mostrar IDs técnicos ao utilizador e tenta apresentar nomes reais quando disponíveis.
- Estados técnicos como `REJECTED`, `ACTIVE`, `RESULTADOS_PUBLICADOS` passam a aparecer em português.
- O limite de auditoria foi aumentado para permitir consultar mais registos.

## 2. Filtros e paginação

- Removido o filtro global automático que actuava directamente sobre as linhas da tabela no DOM.
- A mensagem falsa do tipo `"active" não encontrado ou indisponível` foi eliminada.
- Os filtros ficam controlados pelas próprias páginas React, evitando conflito entre paginação e tabela.
- Pesquisas passam a aceitar melhor acentuação, como `activo`, `ativo`, `órgão`, `orgao`, etc.

## 3. Estados e soft-delete

- Registos com estado `INACTIVE` deixam de aparecer nas listagens normais.
- Eliminar passa a ocultar o registo por estado `INACTIVE` quando a tabela possui coluna `status`.
- Registos desactivados permanecem na base de dados, mas ficam invisíveis para o utilizador.
- Registos suspensos não são usados em selects e checkboxes de selecção.

## 4. Configurações e palavra-passe

- Corrigida a situação em que a palavra-passe era actualizada, mas aparecia mensagem de erro.
- A resposta do backend agora devolve também os dados actualizados do utilizador.
- Adicionado botão de olho para mostrar/ocultar palavra-passe.
- A validação visual foi simplificada para evitar conflitos com validações globais.

## 5. Interface e usabilidade

- O erro `getActionName is not defined` foi corrigido.
- Os modais passam a ocupar correctamente toda a tela através do overlay.
- A janela de consulta ficou mais profissional e legível.
- Os selects pesquisáveis ocupam toda a largura do campo.
- A seta dos selects foi alinhada no centro à direita.
- A tipografia foi normalizada: h1, h2, h3, p, span e texto de tabela ficam mais consistentes.
- A primeira linha das tabelas usa peso semi-bold.
- A classe `baixo` foi ajustada para não deixar grandes espaços entre o nome e os detalhes.

## 6. Resultados e publicação

- O painel de publicação de resultados foi melhorado visualmente.
- O fluxo recomendado continua: eleição concluída → publicar resultados → indicar se houve votos presenciais → guardar/aprovar presenciais → publicar resultado final.

## 7. Realtime

Para o realtime funcionar, devem estar ligados:

```bash
php artisan serve
php artisan reverb:start
php artisan queue:work --verbose
php artisan schedule:work
npm run dev
```

Também é obrigatório confirmar o `.env` do backend e do frontend com as mesmas chaves do Reverb.

## 8. Instalação rápida

Backend:

```bash
cd ademo-eleitoral-backend
composer install
copy .env.example .env
php artisan key:generate
php artisan optimize:clear
php artisan migrate
php artisan storage:link
php artisan serve
```

Frontend:

```bash
cd ademo-eleitoral-frontend
npm install
copy .env.example .env
npm run dev
```
