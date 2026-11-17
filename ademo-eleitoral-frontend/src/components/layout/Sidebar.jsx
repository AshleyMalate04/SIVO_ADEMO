import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronsUpDown, CircleUserRound, ClipboardList, LogOut, X } from 'lucide-react'
import logoAdemo from '../../assets/logos/logo_ademo.png'
import { menuItems } from '../../config/menu'
import { clearAuthData, getAuthUser } from '../../lib/storage'
import { logout } from '../../services/authService'
import { filterMenuByRole } from '../../utils/permissions'
import { getRoleLabel } from '../../constants/roles'

export default function Sidebar({ open = false, onClose }) {
  const user = getAuthUser()
  const navigate = useNavigate()
  const items = filterMenuByRole(menuItems, user?.role)
  const groups = [
    { label: 'Visão geral', keys: ['portal', 'dashboard'] },
    { label: 'Gestão eleitoral', collapsible: true, keys: ['delegations', 'organs', 'users', 'members', 'elections', 'election-team', 'candidates', 'voters'] },
    { label: 'Acompanhamento', keys: ['results', 'voter-results', 'audit'] },
  ].map((group) => ({ ...group, items: items.filter((item) => group.keys.includes(item.key)) })).filter((group) => group.items.length)
  const { pathname } = useLocation()
  const managementGroup = groups.find((group) => group.collapsible)
  const managementActive = Boolean(managementGroup?.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)))
  // Opens by itself when the current page belongs to the group; the user can still fold it.
  const [managementOpen, setManagementOpen] = useState(managementActive)
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    if (managementActive && !managementOpen) setManagementOpen(true)
  }
  const initials = user?.name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AD'
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenuRef = useRef(null)

  useEffect(() => {
    if (!accountOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountOpen])

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // A sessão local deve terminar mesmo quando a API estiver indisponível.
    } finally {
      clearAuthData()
      navigate('/login', { replace: true })
    }
  }

  return (
    <aside className={open ? 'sidebar sidebar-open' : 'sidebar'}>
      <div className="sidebar-brand-row">
        <Link className="sidebar-brand" to={user?.role === 'ELEITOR' || user?.role === 'VOTER' ? '/portal-eleitor/votacoes' : '/dashboard'} onClick={onClose}>
          <img src={logoAdemo} alt="" aria-hidden="true" />
          <span><strong>ADEMO</strong><small>Sistema de Votação Eleitoral</small></span>
        </Link>
        <button className="sidebar-close-button" type="button" aria-label="Fechar menu" onClick={onClose}><X size={20} /></button>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {groups.map((group) => {
          const expanded = !group.collapsible || managementOpen
          const listId = `sidebar-group-${group.label.replace(/\s+/g, '-').toLowerCase()}`
          return (
          <div className={group.collapsible ? 'sidebar-group sidebar-group-collapsible' : 'sidebar-group'} key={group.label}>
            {group.collapsible ? (
              <button
                className={managementActive ? 'sidebar-group-toggle has-active' : 'sidebar-group-toggle'}
                type="button"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => setManagementOpen((current) => !current)}
              >
                <ClipboardList size={19} strokeWidth={1.85} aria-hidden="true" />
                <span>{group.label}</span>
                <ChevronDown className="sidebar-group-chevron" size={16} aria-hidden="true" />
              </button>
            ) : <span className="sidebar-section-label">{group.label}</span>}
            {expanded ? (
            <div className={group.collapsible ? 'sidebar-group-items' : 'sidebar-group-items-plain'} id={listId}>
            {group.items.map((item) => {
              const Icon = item.icon
              const useEnd = ['/eleicoes', '/candidatos', '/eleitores', '/portal-eleitor/votacoes'].includes(item.path)
              return (
                <NavLink className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} to={item.path} key={item.key} end={useEnd} onClick={onClose}>
                  <Icon size={19} strokeWidth={1.85} aria-hidden="true" /><span>{item.label}</span>
                </NavLink>
              )
            })}
            </div>
            ) : null}
          </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-account" ref={accountMenuRef}>
          {accountOpen ? (
            <div className="sidebar-account-popover" role="menu" aria-label="Opções da conta">
              <Link to="/perfil" role="menuitem" onClick={() => { setAccountOpen(false); onClose?.() }}><CircleUserRound size={17} /><span>Meu perfil</span></Link>
              <button type="button" role="menuitem" onClick={handleLogout}><LogOut size={17} /><span>Terminar sessão</span></button>
            </div>
          ) : null}
          <button className="sidebar-user" type="button" aria-expanded={accountOpen} aria-haspopup="menu" onClick={() => setAccountOpen((current) => !current)}>
            <span className="sidebar-avatar">{initials}</span>
            <span className="sidebar-user-copy"><strong>{user?.name || 'Utilizador'}</strong><small>{getRoleLabel(user?.role)}</small></span>
            <ChevronsUpDown className="sidebar-account-chevron" size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
