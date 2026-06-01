export const ROLES = {
  ADMIN: "ADMIN",
  COMMISSION: "COMMISSION",
  COMISSAO: "COMISSAO",
  FISCAL: "FISCAL",
  VOTER: "VOTER",
  ELEITOR: "ELEITOR",
};

const ROLE_ALIASES = {
  COMISSAO: ROLES.COMMISSION,
  COMMISSION: ROLES.COMMISSION,
  ELEITOR: ROLES.VOTER,
  VOTER: ROLES.VOTER,
  ADMIN: ROLES.ADMIN,
  FISCAL: ROLES.FISCAL,
};

export function normalizeRole(role = "") {
  return ROLE_ALIASES[String(role).toUpperCase()] ?? String(role).toUpperCase();
}

export function roleMatches(userRole, allowedRoles = []) {
  const normalizedUserRole = normalizeRole(userRole);

  return allowedRoles.map(normalizeRole).includes(normalizedUserRole);
}

export function getRoleLabel(role = "") {
  return {
    ADMIN: "Administrador",
    COMMISSION: "Comissão",
    COMISSAO: "Comissão",
    FISCAL: "Fiscal",
    VOTER: "Eleitor",
    ELEITOR: "Eleitor",
  }[String(role).toUpperCase()] ?? role;
}
