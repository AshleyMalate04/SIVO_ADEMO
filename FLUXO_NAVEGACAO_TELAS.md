# Fluxo de navegação entre telas — ADEMO Eleitoral

## 1. Administrador

O administrador usa o sistema para consultar e manter dados base, como delegações, órgãos, cargos, membros e utilizadores operacionais. Quando o perfil não tem permissão para registar numa determinada área, a tela mostra apenas a listagem e os filtros, sem o botão de registo desnecessário.

Fluxo principal:

```text
Login → Dashboard → Delegações / Órgãos / Membros / Comissão e Fiscal / Eleições / Resultados / Auditoria / Configurações
```

## 2. Comissão Eleitoral

A Comissão gere apenas as eleições para as quais foi seleccionada. A listagem de eleições, resultados, candidatos e eleitores respeita essa autorização.

Fluxo recomendado:

```text
Login → Eleições → Nova eleição → Definir equipa → Registar candidatos → Registar eleitores → Acompanhar votação → Concluir → Publicar resultados
```

## 3. Fiscal

O Fiscal tem perfil de consulta e auditoria. Pode consultar eleições associadas, resultados e auditoria, mas não deve fazer registos operacionais.

Fluxo recomendado:

```text
Login → Eleições → Consultar detalhes → Resultados → Auditoria
```

## 4. Eleitor

O eleitor só vê eleições em que foi autorizado a participar. Pode consultar resultados das suas eleições autorizadas, mesmo quando ainda estão programadas, em votação, concluídas ou com resultados publicados.

Fluxo recomendado:

```text
Login → Portal do Eleitor → Minhas eleições → Participar ou consultar resultados → Notificações → Configurações
```

Filtros do eleitor:

- Programada;
- Em votação;
- Concluída;
- Resultados publicados;
- Participei.

Quando o eleitor já votou, o botão Participar fica desactivado.

## 5. Resultados presenciais

Quando uma eleição estiver concluída, a Comissão pode publicar resultados directamente ou indicar que houve votação presencial.

Fluxo com votos presenciais:

```text
Resultados → Publicar resultados → Houve votos presenciais? Sim → Inserir totais → Guardar → Aprovar → Publicar → Consultar resultado final
```

Fluxo sem votos presenciais:

```text
Resultados → Publicar resultados → Houve votos presenciais? Não → Publicar apenas resultados online
```

## 6. Realtime

As páginas de eleições, resultados, selecção de eleições, portal do eleitor e notificações escutam eventos em tempo real. Quando houver mudança de estado, voto, apuramento presencial ou publicação, o frontend recarrega os dados automaticamente.
