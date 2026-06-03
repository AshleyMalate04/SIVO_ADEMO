const ascii = (value) => String(value ?? '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[\s-]+/g, '_')

export const normalizeStatus = (value) => {
  const status = ascii(value)
  const map = {
    ACTIVO: 'ACTIVE', ATIVO: 'ACTIVE', ACTIVA: 'ACTIVE', ATIVA: 'ACTIVE', ACTIVE: 'ACTIVE',
    INACTIVO: 'INACTIVE', INATIVO: 'INACTIVE', INACTIVA: 'INACTIVE', INATIVA: 'INACTIVE', INACTIVE: 'INACTIVE', DESACTIVADO: 'INACTIVE', DESATIVADO: 'INACTIVE', DESACTIVADA: 'INACTIVE', DESATIVADA: 'INACTIVE',
    SUSPENSO: 'SUSPENDED', SUSPENSA: 'SUSPENDED', SUSPENDED: 'SUSPENDED', BLOCKED: 'SUSPENDED',
    AUTORIZADO: 'AUTHORIZED', AUTORIZADA: 'AUTHORIZED', AUTHORIZED: 'AUTHORIZED',
    REMOVIDO: 'REMOVED', REMOVIDA: 'REMOVED', REMOVED: 'REMOVED',
    APROVADO: 'APPROVED', APROVADA: 'APPROVED', APPROVED: 'APPROVED',
    REJEITADO: 'REJECTED', REJEITADA: 'REJECTED', REJECTED: 'REJECTED',
    PROGRAMADA: 'PROGRAMADA', PROGRAMADO: 'PROGRAMADA',
    EM_VOTACAO: 'EM_VOTACAO', VOTACAO: 'EM_VOTACAO', VOTANDO: 'EM_VOTACAO',
    CONCLUIDA: 'CONCLUIDA', CONCLUIDO: 'CONCLUIDA',
    RESULTADOS_PUBLICADOS: 'RESULTADOS_PUBLICADOS', PUBLICADA: 'RESULTADOS_PUBLICADOS', PUBLICADO: 'RESULTADOS_PUBLICADOS',
  }
  return map[status] ?? status
}

export const isActiveStatus = (status) => normalizeStatus(status) === 'ACTIVE'
export const isActiveRecord = (record) => isActiveStatus(record?.status)
export const onlyActive = (records = []) => records.filter(isActiveRecord)
export const normalizeId = (value) => (value === null || value === undefined || value === '' ? '' : String(value))

export const commonStatusLabel = (status) => ({
  ACTIVE: 'Activo',
  INACTIVE: 'Desactivado',
  SUSPENDED: 'Suspenso',
  BLOCKED: 'Bloqueado',
  AUTHORIZED: 'Autorizado',
  REMOVED: 'Removido',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
}[normalizeStatus(status)] ?? String(status ?? 'Indefinido'))

export const commonStatusClass = (status) => ({
  ACTIVE: 'active',
  AUTHORIZED: 'active',
  APPROVED: 'active',
  INACTIVE: 'inactive',
  REMOVED: 'inactive',
  REJECTED: 'inactive',
  SUSPENDED: 'suspended',
  BLOCKED: 'suspended',
}[normalizeStatus(status)] ?? 'scheduled')

export const isInactiveStatus = (status) => normalizeStatus(status) === 'INACTIVE'
export const isSuspendedStatus = (status) => normalizeStatus(status) === 'SUSPENDED'
export const visibleRecord = (record) => !isInactiveStatus(record?.status)
export const onlyVisible = (records = []) => records.filter(visibleRecord)
export const selectableRecord = (record) => isActiveStatus(record?.status)
export const onlySelectable = (records = []) => records.filter(selectableRecord)

export const searchText = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
