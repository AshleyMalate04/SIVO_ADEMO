import { roleMatches } from "../constants/roles";

export function hasPermission(userPermissions = [], permission) {
  return userPermissions.includes(permission);
}

export function canAccessRole(userRole, allowedRoles = []) {
  return roleMatches(userRole, allowedRoles);
}

export function filterMenuByRole(menuItems = [], role) {
  return menuItems.filter((item) => canAccessRole(role, item.roles));
}
