import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, MapPinned, X } from "lucide-react";
import { menuItems } from "../../config/menu";
import { clearAuthData, getAuthUser } from "../../lib/storage";
import { logout } from "../../services/authService";
import { filterMenuByRole } from "../../utils/permissions";

export default function Sidebar({ open = false, onClose }) {
  const user = getAuthUser();
  const navigate = useNavigate();
  const items = filterMenuByRole(menuItems, user?.role);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Mesmo que a API falhe, o utilizador deve sair do frontend.
    } finally {
      clearAuthData();
      navigate("/login", { replace: true });
    }
  }

  return (
    <aside className={open ? "sidebar sidebar-open" : "sidebar"}>
      <div className="mobile-sidebar-header">
        <strong>Menu</strong>
        <button type="button" aria-label="Fechar menu" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="mobile-sidebar-profile">
        <span>{user?.name?.slice(0, 2)?.toUpperCase() || "AD"}</span>
        <div>
          <strong>{user?.name || "Utilizador"}</strong>
          <small>{user?.role || "Perfil"}</small>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {items.map((item) => {
          const Icon = item.icon;
          const useEnd = ["/eleicoes", "/candidatos", "/eleitores", "/portal-eleitor/votacoes"].includes(item.path);

          return (
            <NavLink
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
              to={item.path}
              key={item.key}
              title={item.label}
              end={useEnd}
              onClick={onClose}
            >
              <Icon size={22} strokeWidth={1.9} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-location">
        <MapPinned size={18} />
        <span>Maputo</span>
      </div>
      {/* <button className="sidebar-password" type="button" onClick={() => navigate("/configuracoes")}>
        Definir senha
      </button> */}
      <button className="sidebar-logout" type="button" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Sair</span>
      </button>
    </aside>
  );
}
