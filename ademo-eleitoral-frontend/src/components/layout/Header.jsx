import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import logoAdemo from '../../assets/logos/logo_ademo.png'

export default function Header({ user, scrolled = false }) {
  return (
    <header className={scrolled ? 'app-header app-header-scrolled' : 'app-header'}>
      <Link className="brand" to="/dashboard">
        <img src={logoAdemo} alt="ADEMO" className="brand-logo" />
        <span>Sistema Eleitoral ADEMO</span>
      </Link>

      <div className="user-menu">
        <div className="user-meta">
          <strong>{user.name}</strong>
          <span>{user.roleLabel}</span>
        </div>
        <Link className="logout-button" to="/login" aria-label="Sair">
          <LogOut size={24} strokeWidth={1.8} />
        </Link>
      </div>
    </header>
  )
}
