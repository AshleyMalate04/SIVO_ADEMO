import { useMemo } from "react";
import { getRoleLabel, normalizeRole } from "../constants/roles";
import { getAuthMenu, getAuthToken, getAuthUser, isAuthenticated } from "../lib/storage";

export function useAuth() {
  const user = getAuthUser();

  return useMemo(
    () => ({
      token: getAuthToken(),
      user,
      menu: getAuthMenu(),
      role: normalizeRole(user?.role),
      roleLabel: getRoleLabel(user?.role),
      isAuthenticated: isAuthenticated(),
    }),
    [user],
  );
}
