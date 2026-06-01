import { Outlet } from "react-router-dom";
import logoAdemo from "../../assets/logos/logo_ademo.png";
import AppHeader from "./AppHeader";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <AppHeader isAuth={true} />
      <main className="auth-shell">
        <section className="auth-brand-panel">
          <img src={logoAdemo} alt="ADEMO" className="auth-logo" />
          <h1>SISTEMA DE VOTAÇÃO ELEITORAL</h1>
        </section>
        <section className="auth-form-panel">{children ?? <Outlet />}</section>
      </main>
    </div>
  );
}
