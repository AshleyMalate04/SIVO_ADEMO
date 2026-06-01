import { Link, useNavigate } from "react-router-dom";
import { KeyRound, LogOut, Menu, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logoAdemo from "../../assets/logos/logo_ademo.png";
import { logout } from "../../services/authService";
import { clearAuthData } from "../../lib/storage";

export default function AppHeader({
  user,
  scrolled = false,
  isAuth = false,
  showMenuButton = false,
  onMenuClick,
}) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

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
    <header
      className={scrolled ? "app-header app-header-scrolled" : "app-header"}
    >
      <Link className="brand" to={isAuth ? "/" : "/dashboard"}>
        <img src={logoAdemo} alt="ADEMO" className="brand-logo" />
        <span>Sistema Eleitoral ADEMO</span>
      </Link>

      <nav className="header-nav">
        <div className="header-actions">
          {user && !isAuth ? (
            <div className="user-info">
              <div className="user-meta">
                <strong>{user.name}</strong>
                <span>{user.roleLabel}</span>
              </div>
              <button className="logout-link" type="button" onClick={handleLogout} aria-label="Sair">
                <LogOut size={20} strokeWidth={1.8} />
              </button>
            </div>
          ) : null}

          {user && !isAuth ? (
            <div className="mobile-profile-menu" ref={profileMenuRef}>
              <button className="mobile-profile-trigger" type="button" aria-label="Abrir perfil" onClick={() => setProfileOpen((current) => !current)}>
                <UserRound size={18} />
              </button>
              {profileOpen ? (
                <div className="mobile-profile-card">
                  <strong>{user.name}</strong>
                  <span>{user.roleLabel}</span>
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("/configuracoes"); }}>
                    <KeyRound size={15} /> Definir senha
                  </button>
                  <button className="danger-link" type="button" onClick={handleLogout}>
                    <LogOut size={15} /> Sair
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {showMenuButton && !isAuth ? (
            <button className="mobile-menu-button" type="button" aria-label="Abrir menu" onClick={onMenuClick}>
              <Menu size={22} />
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
