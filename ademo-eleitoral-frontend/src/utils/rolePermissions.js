export function canManageResource(role, resource) {
  const permissions = {
    delegations: ['ADMIN'],
    organs: ['ADMIN'],
    users: ['ADMIN'],
    members: ['ADMIN', 'COMMISSION'],
    elections: ['COMMISSION'],
    candidates: ['COMMISSION'],
    voters: ['COMMISSION'],
  }

  return (permissions[resource] ?? []).includes(role)
}

export function canCreateResource(role, resource) {
  return canManageResource(role, resource)
}

export function canMutateStatus(role, resource) {
  return resource !== 'elections' && canManageResource(role, resource)
}

export function shouldShowActions(role, resource) {
  return Boolean(role && resource)
}
