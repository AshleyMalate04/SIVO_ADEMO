# Correções globais aplicadas — ADEMO Eleitoral

## 1. Datas e fuso horário

Foi corrigido o fluxo de datas para evitar que a hora digitada no formulário seja alterada ao guardar ou ao voltar a listar.

### Alterações principais

- O frontend agora envia datas no formato local simples:

```txt
YYYY-MM-DD HH:mm:ss
```

- O backend normaliza `starts_at` e `ends_at` sem converter para UTC.
- O model `Election` serializa datas como:

```txt
YYYY-MM-DD HH:mm:ss
```

- O timezone da aplicação é definido com `APP_TIMEZONE=Africa/Maputo` e aplicado no `AppServiceProvider`.

### Teste recomendado

Criar uma eleição com:

```txt
20/05/2026 14:00
```

Depois consultar a eleição. A data deve voltar exactamente como foi registada, sem desvio de hora.

---

## 2. Selects com dados activos

Foram ajustadas as páginas de registo/edição para não listar entidades inactivas/suspendidas nos selects de novas operações.

### Exemplos corrigidos

- Delegações na criação de eleições.
- Órgãos na criação de eleições.
- Cargos na criação de eleições.
- Delegações no registo de membros.
- Delegações no registo de utilizadores operacionais.
- Províncias e distritos no registo de delegações.
- Eleições no registo de candidatos.
- Eleições no registo de eleitores.
- Eleições na definição de equipa.

---

## 3. Eleições apenas no estado PROGRAMADA para operações antes da votação

Nas telas onde se registam dados que devem ser preparados antes do início da votação, agora aparecem apenas eleições com estado:

```txt
PROGRAMADA
```

Aplicado em:

- Definir equipa da eleição.
- Registar candidatos.
- Registar eleitores.

A opção aparece com o nome e o estado:

```txt
Eleição X (PROGRAMADA)
```

---

## 4. Checkboxes pré-seleccionados

Foram ajustadas as telas de selecção para marcar automaticamente os registos já associados.

Aplicado em:

- Equipa da eleição.
- Eleitores autorizados.

Se um utilizador ou eleitor já estava associado à eleição, o checkbox aparece marcado.

---

## 5. Filtros corrigidos

Foram ajustados filtros que comparavam nomes em vez de IDs ou comparavam números com strings.

Corrigido em:

- Tela de eleições: filtro por delegação.
- Tela de equipa da eleição: filtro por delegação/perfil.
- Tela de candidatos: filtro por delegação.
- Tela de eleitores: filtro por delegação.
- Tela de selecção de eleições para resultados/auditoria.

---

## 6. Estado do candidato

O candidato deixou de usar o estado inicial `PENDING`.

Agora os estados aceites são:

```txt
APPROVED
REJECTED
SUSPENDED
```

Ao criar candidato, se o frontend ou o pedido não enviar estado, o backend assume automaticamente:

```txt
APPROVED
```

Também foi criada uma migration para converter candidatos antigos com `PENDING` para `APPROVED`.

---

## 7. Notificações

As validações e erros das telas ajustadas continuam a usar o padrão `notify.success`, `notify.error`, `notify.warning` e `notify.info`, que aparece como toast/card no canto superior direito via `sonner`.

---

## 8. Comandos depois de substituir os ficheiros

No backend:

```bash
cd ademo-eleitoral-backend
php artisan optimize:clear
php artisan migrate
php artisan serve
```

No frontend:

```bash
cd ademo-eleitoral-frontend
npm install
npm run dev
```

Se o frontend der erro de dependência opcional do Vite/Rolldown, apaga `node_modules` e instala novamente:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

No Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```

---

## 9. Validação técnica feita

Foram executadas verificações de sintaxe PHP e parsing JS/JSX.

Observação: o build Vite não pôde ser concluído neste ambiente porque faltava a dependência nativa opcional `@rolldown/binding-linux-x64-gnu` dentro do `node_modules` enviado no ZIP. Isso é resolvido reinstalando as dependências com `npm install` no teu computador.
