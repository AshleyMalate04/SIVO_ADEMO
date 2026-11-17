import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import logoAdemo from '../../assets/logos/logo_ademo.png'
import { menuItems } from '../../config/menu'
import { filterMenuByRole } from '../../utils/permissions'

const sections = [
  { path: '/portal-eleitor/resultados', title: 'Resultados eleitorais', group: 'Portal do eleitor' },
  { path: '/portal-eleitor/votacoes', title: 'Eleições disponíveis', group: 'Portal do eleitor' },
  { path: '/portal-eleitor/eleicoes', title: 'Detalhes da eleição', group: 'Portal do eleitor' },
  { path: '/comissao-fiscal', title: 'Comissão e Fiscal', group: 'Gestão eleitoral' },
  { path: '/eleicoes/equipa', title: 'Equipa da eleição', group: 'Gestão eleitoral' },
  { path: '/orgaos-cargos', title: 'Órgãos e Cargos', group: 'Gestão eleitoral' },
  { path: '/delegacoes', title: 'Delegações', group: 'Gestão eleitoral' },
  { path: '/candidatos', title: 'Candidatos', group: 'Gestão eleitoral' },
  { path: '/eleitores', title: 'Eleitores', group: 'Gestão eleitoral' },
  { path: '/membros', title: 'Membros', group: 'Gestão eleitoral' },
  { path: '/eleicoes', title: 'Eleições', group: 'Gestão eleitoral' },
  { path: '/resultados', title: 'Resultados', group: 'Acompanhamento' },
  { path: '/auditoria', title: 'Auditoria', group: 'Acompanhamento' },
  { path: '/perfil', title: 'O meu perfil', group: 'Conta' },
  { path: '/configuracoes', title: 'O meu perfil', group: 'Conta' },
  { path: '/dashboard', title: 'Painel Inicial', group: 'Visão geral' },
  { path: '/votar', title: 'Boletim de voto', group: 'Portal do eleitor' },
]

function getSection(pathname) {
  return sections.find((section) => pathname.startsWith(section.path)) ?? {
    title: 'Sistema de Votação Eleitoral',
    group: 'ADEMO',
  }
}

export default function Header({ user, scrolled = false, showMenuButton = false, onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const section = getSection(location.pathname)
  const homePath = user?.role === 'ELEITOR' || user?.role === 'VOTER'
    ? '/portal-eleitor/votacoes'
    : '/dashboard'
  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'AD'
  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt')
    if (!term) return []
    return filterMenuByRole(menuItems, user?.role)
      .filter((item) => item.label.toLocaleLowerCase('pt').includes(term))
      .slice(0, 6)
  }, [query, user?.role])

  useEffect(() => {
    if (!searchOpen) return undefined
    const closeSearch = (event) => {
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('pointerdown', closeSearch)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeSearch)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [searchOpen])

  const openResult = (path) => {
    setQuery('')
    setSearchOpen(false)
    navigate(path)
  }

  return (
    <header className={scrolled ? 'app-header app-header-scrolled' : 'app-header'}>
      <Link className="mobile-header-brand" to={homePath} aria-label="Ir para a página inicial">
        <img src={logoAdemo} alt="" aria-hidden="true" />
        <span><strong>ADEMO</strong><small>Sistema de Votação Eleitoral</small></span>
      </Link>

      <div className="header-context">
        <div><span>{section.group}</span><strong>{section.title}</strong></div>
      </div>

      <div className="header-search-slot" ref={searchRef} role="search">
        <div className="global-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Pesquisar uma funcionalidade..."
            aria-label="Pesquisar uma funcionalidade"
            aria-expanded={searchOpen}
            aria-controls="header-search-results"
            onFocus={() => setSearchOpen(Boolean(query.trim()))}
            onChange={(event) => {
              setQuery(event.target.value)
              setSearchOpen(Boolean(event.target.value.trim()))
            }}
          />
          {searchOpen ? (
            <div className="global-search-results" id="header-search-results" role="listbox">
              {searchResults.length ? searchResults.map((item) => {
                const ItemIcon = item.icon
                return (
                  <button type="button" role="option" aria-selected="false" key={item.key} onClick={() => openResult(item.path)}>
                    <ItemIcon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                )
              }) : <span className="global-search-empty">Nenhuma funcionalidade encontrada.</span>}
            </div>
          ) : null}
        </div>
      </div>

      <div className="header-tools">
        <Link className="header-initials-link" to="/perfil" aria-label={`Abrir o perfil de ${user?.name || 'utilizador'}`} title="O meu perfil">
          <span className="header-avatar" aria-hidden="true">{initials}</span>
        </Link>
      </div>

      {showMenuButton ? (
        <button className="mobile-menu-button" type="button" aria-label="Abrir menu principal" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
      ) : null}
    </header>
  )
}
