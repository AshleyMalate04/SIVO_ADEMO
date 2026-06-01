# Guia de Acessibilidade Visual e Cores — Sistema ADEMO

## 1. Objectivo

Este documento define uma proposta de cores, estados visuais, botões, inputs, notificações e boas práticas de acessibilidade para o Sistema de Votação Eleitoral da ADEMO.

A intenção é tornar o sistema mais:

- acessível para pessoas com deficiência visual;
- legível para pessoas com baixa visão;
- compreensível para pessoas com daltonismo;
- profissional e consistente;
- fácil de utilizar em computador, tablet e telemóvel.

---

## 2. Regra principal de acessibilidade

A cor não deve ser o único meio de comunicação.

Exemplo incorrecto:

> Mostrar um botão apenas em vermelho sem texto claro.

Exemplo correcto:

> Botão vermelho com texto “Eliminar”, ícone de lixeira e confirmação em modal.

Assim, mesmo que o utilizador tenha dificuldade em distinguir cores, ele ainda entende a acção pelo texto, ícone e contexto.

---

## 3. Contraste recomendado

Para acessibilidade, recomenda-se seguir as boas práticas da WCAG:

- texto normal deve ter contraste mínimo de **4.5:1**;
- texto grande deve ter contraste mínimo de **3:1**;
- componentes de interface, como bordas de inputs, ícones importantes e botões, devem ter contraste mínimo de **3:1**.

Na prática, evita:

- texto cinzento muito claro;
- botões com cor clara e texto branco;
- estados que dependem apenas de cor;
- inputs sem borda visível;
- remover o `outline` sem colocar outro foco visível.

---

## 4. Paleta recomendada

```css
:root {
  /* Base */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-soft: #f1f5f9;

  /* Texto */
  --color-text: #0f172a;
  --color-text-muted: #475569;
  --color-text-soft: #64748b;

  /* Marca / acção principal */
  --color-primary: #075985;
  --color-primary-hover: #0c4a6e;
  --color-primary-soft: #e0f2fe;

  /* Sucesso */
  --color-success: #166534;
  --color-success-soft: #dcfce7;

  /* Aviso */
  --color-warning: #92400e;
  --color-warning-soft: #fef3c7;

  /* Perigo */
  --color-danger: #991b1b;
  --color-danger-hover: #7f1d1d;
  --color-danger-soft: #fee2e2;

  /* Informação */
  --color-info: #1d4ed8;
  --color-info-soft: #dbeafe;

  /* Bordas */
  --color-border: #cbd5e1;
  --color-border-strong: #94a3b8;

  /* Foco acessível */
  --color-focus: #f59e0b;
}
```

---

## 5. Uso correcto das cores

### 5.1 Azul escuro — acções principais

O azul escuro deve ser usado para acções principais e positivas do sistema.

Usar em:

- Entrar;
- Criar eleição;
- Guardar;
- Alterar dados;
- Confirmar;
- Publicar resultados;
- Registar;
- Autorizar eleitores.

```css
.primary-action-button,
.primary-button {
  background: var(--color-primary);
  color: #ffffff;
}

.primary-action-button:hover,
.primary-button:hover {
  background: var(--color-primary-hover);
}
```

Justificação:

O azul escuro passa confiança, tem bom contraste com texto branco e é mais institucional do que cores muito vivas.

---

### 5.2 Vermelho — somente para perigo real

O vermelho deve ser reservado para acções perigosas, críticas ou destrutivas.

Usar em:

- Eliminar;
- Suspender;
- Cancelar eleição;
- Bloquear utilizador;
- Remover eleitor;
- Rejeitar candidato;
- Erros graves.

```css
.danger-action-button,
.delete-button {
  background: var(--color-danger);
  color: #ffffff;
}

.danger-action-button:hover,
.delete-button:hover {
  background: var(--color-danger-hover);
}
```

Não usar vermelho em:

- botões normais;
- avisos simples;
- filtros;
- estado programado;
- acções neutras;
- links de consulta.

Sempre que houver vermelho, deve haver também texto claro.

Exemplo:

```text
Suspender registo
Este registo ficará indisponível para novas operações.
```

---

### 5.3 Verde — sucesso e estados positivos

O verde deve indicar sucesso ou estado positivo.

Usar em:

- Activo;
- Aprovado;
- Resultados publicados;
- Voto registado com sucesso;
- Operação realizada com sucesso.

```css
.status-active,
.status-approved,
.status-published {
  background: var(--color-success-soft);
  color: var(--color-success);
}
```

Evitar usar verde como botão principal geral. Para botões principais, usar azul.

---

### 5.4 Amarelo/Laranja — aviso ou atenção

Usar para estados que exigem atenção, mas não representam erro.

Usar em:

- Programada;
- Pendente;
- Faltam 2 horas para terminar;
- Resultados presenciais por aprovar;
- Avisos informativos.

```css
.status-warning,
.status-programada {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
```

---

### 5.5 Cinzento — neutro, desactivado ou indisponível

Usar para:

- Desactivado;
- Indisponível;
- Sem dados;
- Botões desabilitados;
- Registos inactivos.

```css
button:disabled,
.disabled-button {
  background: #e2e8f0;
  color: #64748b;
  cursor: not-allowed;
}
```

Atenção:

O texto cinzento deve continuar legível. Evita cinzentos muito claros em fundo branco.

---

## 6. Cores para estados da eleição

```css
.status-programada {
  background: #fef3c7;
  color: #92400e;
}

.status-em-votacao {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-concluida {
  background: #e0e7ff;
  color: #3730a3;
}

.status-resultados-publicados {
  background: #dcfce7;
  color: #166534;
}

.status-cancelada,
.status-suspensa {
  background: #fee2e2;
  color: #991b1b;
}
```

| Estado | Cor recomendada | Motivo |
|---|---|---|
| Programada | Amarelo/Laranja | Ainda vai acontecer |
| Em votação | Azul | Processo activo |
| Concluída | Roxo/Índigo | Terminou, mas pode não estar publicada |
| Resultados publicados | Verde | Processo finalizado com sucesso |
| Suspensa/Cancelada | Vermelho escuro | Estado crítico |

---

## 7. Cores para utilizadores, membros e candidatos

```css
.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-inactive {
  background: #e2e8f0;
  color: #475569;
}

.status-suspended {
  background: #fee2e2;
  color: #991b1b;
}

.status-approved {
  background: #dcfce7;
  color: #166534;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}
```

Regras importantes:

- registos inactivos ou desactivados não devem aparecer em selects;
- registos suspensos não devem aparecer em selects nem checkboxes de selecção;
- registos suspensos podem aparecer apenas em páginas administrativas, se for necessário consultar histórico;
- registos desactivados funcionam como soft-delete: continuam na base de dados, mas não aparecem para operação normal.

---

## 8. Inputs, selects e pesquisa

Inputs, selects e campos de pesquisa devem ter borda visível e foco claro.

```css
input,
select,
textarea {
  border: 1px solid var(--color-border);
  color: var(--color-text);
  background: #ffffff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--color-primary);
  outline: 3px solid rgba(245, 158, 11, 0.35);
}
```

### Regras para selects

- cursor deve ser `pointer`;
- seta deve estar alinhada ao centro à direita;
- campo deve ocupar toda a largura disponível;
- opções inactivas ou suspensas não devem aparecer;
- texto deve estar em português.

```css
select {
  cursor: pointer;
}

.searchable-select {
  width: 100%;
}

.searchable-select button,
.searchable-select input,
.searchable-select select {
  width: 100%;
}
```

---

## 9. Botões

### 9.1 Botão principal

Usar em acções principais.

```css
.primary-action-button {
  background: #075985;
  color: #ffffff;
}
```

Usar em:

- Guardar;
- Criar;
- Alterar;
- Confirmar;
- Publicar;
- Entrar.

---

### 9.2 Botão secundário

Usar em acções neutras.

```css
.secondary-button {
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}
```

Usar em:

- Cancelar;
- Voltar;
- Limpar filtro;
- Ver detalhes;
- Consultar.

---

### 9.3 Botão perigoso

Usar apenas para acções críticas.

```css
.danger-action-button {
  background: #991b1b;
  color: #ffffff;
}
```

Usar em:

- Eliminar;
- Suspender;
- Remover;
- Bloquear;
- Rejeitar.

---

## 10. Notificações e toasts

As notificações devem aparecer no canto superior direito e devem ser usadas apenas quando necessário.

Manter toasts para:

- sucesso;
- erro;
- avisos realmente importantes.

Evitar toasts para:

- consultar;
- abrir modal;
- clicar em visualizar;
- navegação simples;
- mensagens repetitivas.

```css
.toast-success {
  background: #dcfce7;
  color: #166534;
  border-left: 5px solid #166534;
}

.toast-error {
  background: #fee2e2;
  color: #991b1b;
  border-left: 5px solid #991b1b;
}

.toast-warning {
  background: #fef3c7;
  color: #92400e;
  border-left: 5px solid #92400e;
}

.toast-info {
  background: #dbeafe;
  color: #1d4ed8;
  border-left: 5px solid #1d4ed8;
}
```

---

## 11. Tabelas

As tabelas devem ser legíveis e consistentes.

Regras:

- cabeçalho da tabela deve ser semi-bold;
- primeira linha com nomes das colunas deve ter bom contraste;
- evitar texto muito pequeno;
- em telemóvel, a tabela deve transformar-se em cartões;
- botões de acção devem ter ícones e `aria-label`;
- evitar scroll horizontal desnecessário.

```css
table thead th {
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-surface-soft);
}
```

---

## 12. Tipografia

Todos os elementos devem ter tamanhos consistentes.

Proposta:

```css
:root {
  --font-h1: 30px;
  --font-h2: 25px;
  --font-h3: 21px;
  --font-body: 16px;
  --font-small: 14px;
}
```

```css
h1 {
  font-size: var(--font-h1);
  line-height: 1.2;
}

h2 {
  font-size: var(--font-h2);
  line-height: 1.25;
}

h3 {
  font-size: var(--font-h3);
  line-height: 1.3;
}

p,
span,
b,
strong,
label,
input,
select,
textarea,
button {
  font-size: var(--font-body);
}
```

Atenção:

- botões muito pequenos prejudicam usabilidade;
- detalhes de eleição, candidato e resultados não devem ter fonte pequena;
- informações importantes devem ter hierarquia visual clara.

---

## 13. Foco visível

Nunca remover o foco do teclado sem substituir por outro.

Errado:

```css
button:focus {
  outline: none;
}
```

Correcto:

```css
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid rgba(245, 158, 11, 0.55);
  outline-offset: 3px;
}
```

Isto ajuda utilizadores que navegam pelo teclado.

---

## 14. Modais

Modais devem preencher a tela toda por cima da página, e não apenas dentro da tabela.

```css
.modal-overlay {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  z-index: 9999 !important;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  overflow-y: auto;
}

.professional-modal-card,
.action-dialog {
  width: min(760px, 100%);
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
}
```

Sempre que possível, usar `createPortal` no React:

```jsx
{modal ? createPortal(
  <ActionModal />,
  document.body
) : null}
```

---

## 15. Classe `baixo`

A classe usada para mostrar texto secundário abaixo de outro texto deve ter pouco espaçamento e ficar visualmente colada.

Exemplo:

```text
Ashley Malate
Online: x · Presencial: y
```

Não deve ficar assim:

```text
Ashley Malate


Online: x · Presencial: y
```

CSS recomendado:

```css
.baixo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}

.baixo small,
.baixo span {
  margin: 0;
  line-height: 1.25;
}
```

---

## 16. Regras finais para o sistema

1. Vermelho é apenas para perigo real.
2. Azul escuro é para acções principais.
3. Verde é para sucesso e estados positivos.
4. Amarelo/Laranja é para aviso.
5. Cinzento é para estado neutro, indisponível ou desactivado.
6. Nunca depender apenas da cor.
7. Sempre usar texto claro nos estados.
8. Inputs e selects devem ter foco visível.
9. Botões desactivados devem ser legíveis.
10. Desactivado/inactivo não aparece em selects nem checkboxes.
11. Suspenso não aparece em selects nem checkboxes.
12. Tabelas devem ter cabeçalho semi-bold.
13. Modais devem abrir sobre a página inteira.
14. Toasts devem ser usados apenas para sucesso, erro e avisos importantes.
15. Todo o sistema deve usar português claro e consistente.

---

## 17. Referências úteis

- WCAG 2.2 — Web Content Accessibility Guidelines
- WAI — Web Accessibility Initiative
- Boas práticas de contraste, foco visível, navegação por teclado e uso não exclusivo da cor.
