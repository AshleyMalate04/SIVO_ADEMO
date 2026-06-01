export const auditActionLabels = {
  VOTO_REGISTADO: 'Voto registado',
  ELEICAO_CRIADA: 'Eleição criada',
  ELEICAO_ACTUALIZADA: 'Eleição actualizada',
  ESTADO_ELEICAO_ALTERADO_AUTOMATICAMENTE: 'Estado da eleição alterado automaticamente',
  MEMBRO_REGISTADO: 'Membro registado',
  CANDIDATO_SELECCIONADO: 'Candidato seleccionado',
  RESULTADOS_PRESENCIAIS_GUARDADOS: 'Resultados presenciais guardados',
  RESULTADOS_PRESENCIAIS_REGISTADOS: 'Resultados presenciais registados',
  RESULTADOS_PRESENCIAIS_APROVADOS: 'Resultados presenciais aprovados',
  RESULTADOS_PUBLICADOS: 'Resultados publicados',
  REGISTO_OCULTADO: 'Registo ocultado',
  REGISTO_SUSPENSO: 'Registo suspenso',
  REGISTO_ACTIVADO: 'Registo activo',
  REGISTO_CRIADO: 'Registo criado',
  ELEICAO_CONCLUIDA: 'Eleição concluída',
  ELEITORES_AUTORIZADOS: 'Eleitores autorizados',
  EQUIPA_ELEICAO_ACTUALIZADA: 'Equipa da eleição actualizada',
}

export const getAuditActionLabel = (action) => {
  return auditActionLabels[action] ?? action
}