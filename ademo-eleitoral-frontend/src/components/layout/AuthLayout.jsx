import { Outlet } from "react-router-dom";
import logoAdemo from "../../assets/logos/logo_ademo.png";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <main className="auth-shell">
        <section className="auth-brand-panel">
          <img src={logoAdemo} alt="Associação dos Deficientes de Moçambique (ADEMO)" className="auth-logo" />
          <h1>Sistema de Votação Eleitoral</h1>
        </section>
        <section className="auth-form-panel">{children ?? <Outlet />}</section>
      </main>
    </div>
  );
}
