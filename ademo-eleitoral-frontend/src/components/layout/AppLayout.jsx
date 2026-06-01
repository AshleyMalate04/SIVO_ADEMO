import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppHeader from './AppHeader'
import Sidebar from './Sidebar'
import { getRoleLabel } from '../../constants/roles'
import { getAuthUser } from '../../lib/storage'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'

const getActionName = (value = '') => {
  const label = String(value || '').trim()
  const lower = label.toLowerCase()

  if (lower.includes('consultar') || lower.includes('ver')) return 'Consultar'
  if (lower.includes('editar') || lower.includes('alterar')) return 'Editar'
  if (lower.includes('apagar') || lower.includes('eliminar')) return 'Eliminar'
  if (lower.includes('suspender') || lower.includes('inactivar') || lower.includes('inativar')) return 'Suspender'
  if (lower.includes('activar') || lower.includes('ativar')) return 'Activar'
  if (lower.includes('publicar')) return 'Publicar resultados'
  if (lower.includes('aprovar')) return 'Aprovar'
  if (lower.includes('cancelar')) return 'Cancelar'

  return label || 'Acção'
}

export default function AppLayout({ children }) {
  const authUser = getAuthUser()
  const currentUser = authUser
    ? {
        name: authUser.name,
        role: authUser.role,
        roleLabel: getRoleLabel(authUser.role),
      }
    : null

  const normalizedRole = currentUser?.role
  const isVoterShell = normalizedRole === 'ELEITOR' || normalizedRole === 'VOTER'
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useRealtimeNotifications()

  useEffect(() => {
    const applyPreferences = () => {
      const accessibility = localStorage.getItem('ademo-accessibility') === 'true'
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.dataset.accessibility = accessibility ? 'true' : 'false'
    }

    applyPreferences()
    window.addEventListener('ademo-preferences-change', applyPreferences)

    return () => window.removeEventListener('ademo-preferences-change', applyPreferences)
  }, [])

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const applyActionTooltips = () => {
      document.querySelectorAll('.table-action, [data-action-tooltip]').forEach((button) => {
        const label = getActionName(button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent || '')
        button.setAttribute('data-tooltip', label)
        button.setAttribute('title', label)
      })
    }

    applyActionTooltips()
    const observer = new MutationObserver(applyActionTooltips)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const normalize = (value) =>
      String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

    const closeAll = (except) => {
      document.querySelectorAll('.searchable-select.open').forEach((wrapper) => {
        if (wrapper !== except) wrapper.classList.remove('open')
      })
    }

    const enhanceSelects = () => {
      document.querySelectorAll('select').forEach((select) => {
        if (select.dataset.searchEnhanced === 'true') return

        const wrapper = document.createElement('div')
        wrapper.className = 'searchable-select'
        const trigger = document.createElement('button')
        trigger.type = 'button'
        trigger.className = 'searchable-select-trigger'
        const panel = document.createElement('div')
        panel.className = 'searchable-select-panel'
        const input = document.createElement('input')
        input.type = 'search'
        input.className = 'searchable-select-input'
        input.placeholder = 'Pesquisar...'
        const list = document.createElement('div')
        list.className = 'searchable-select-options'

        select.parentNode?.insertBefore(wrapper, select)
        wrapper.appendChild(select)
        wrapper.appendChild(trigger)
        panel.appendChild(input)
        panel.appendChild(list)
        wrapper.appendChild(panel)
        select.dataset.searchEnhanced = 'true'

        const firstOption = select.options[0]
        if (select.closest('.filters-panel') && firstOption && firstOption.value === '') {
          const label = firstOption.textContent.toLowerCase()
          firstOption.disabled = false
          if (label.includes('delega')) firstOption.textContent = 'Todas as delegações'
          else if (label.includes('prov')) firstOption.textContent = 'Todas as províncias'
          else if (label.includes('elei')) firstOption.textContent = 'Todas as eleições'
          else if (label.includes('cargo')) firstOption.textContent = 'Todos os cargos'
          else if (label.includes('perfil')) firstOption.textContent = 'Todos os perfis'
          else if (label.includes('estado')) firstOption.textContent = 'Todos os estados'
          else if (label.includes('tipo') || label.includes('acção') || label.includes('acao')) firstOption.textContent = 'Todos os tipos'
          else firstOption.textContent = 'Todos'
        }

        const readOptions = () =>
          Array.from(select.options).map((option) => ({
            text: option.textContent,
            value: option.value,
            disabled: option.disabled,
          }))

        const updateLabel = () => {
          const selected = select.options[select.selectedIndex]
          trigger.textContent = selected?.textContent || 'Seleccione'
        }

        const renderOptions = () => {
          const term = normalize(input.value)
          const options = readOptions().filter((option) => {
            if (option.disabled && option.value === '') return !term
            return !term || normalize(option.text).includes(term)
          })

          list.innerHTML = ''
          if (!options.length) {
            const empty = document.createElement('span')
            empty.className = 'searchable-select-empty'
            empty.textContent = 'Sem resultados'
            list.appendChild(empty)
            return
          }

          options.forEach((option) => {
            const item = document.createElement('button')
            item.type = 'button'
            item.className = option.value === select.value ? 'searchable-select-option selected' : 'searchable-select-option'
            item.textContent = option.text
            item.disabled = option.disabled
            item.addEventListener('click', () => {
              if (option.disabled) return
              select.value = option.value
              updateLabel()
              select.dispatchEvent(new Event('change', { bubbles: true }))
              wrapper.classList.remove('open')
              input.value = ''
              renderOptions()
            })
            list.appendChild(item)
          })
        }

        trigger.addEventListener('click', () => {
          const willOpen = !wrapper.classList.contains('open')
          closeAll(wrapper)
          wrapper.classList.toggle('open', willOpen)
          if (willOpen) {
            renderOptions()
            window.setTimeout(() => input.focus(), 0)
          }
        })

        input.addEventListener('input', renderOptions)
        select.addEventListener('change', () => {
          updateLabel()
          renderOptions()
        })

        updateLabel()
        renderOptions()
      })
    }

    const handleOutsideClick = (event) => {
      if (!event.target.closest?.('.searchable-select')) closeAll()
    }

    enhanceSelects()
    const observer = new MutationObserver(enhanceSelects)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', handleOutsideClick)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  useEffect(() => {
    const applyMobileTableLabels = () => {
      document.querySelectorAll('.table-card table').forEach((table) => {
        const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent?.trim() || '')
        table.querySelectorAll('tbody tr').forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            if (!cell.getAttribute('data-label')) cell.setAttribute('data-label', headers[index] || 'Informação')
          })
        })
      })
    }

    applyMobileTableLabels()
    const observer = new MutationObserver(applyMobileTableLabels)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return (
    <div className={isVoterShell ? 'app-shell voter-shell' : 'app-shell staff-shell'}>
      <AppHeader
        user={currentUser}
        scrolled={headerScrolled}
        showMenuButton={!isVoterShell}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen ? <button className="sidebar-backdrop" type="button" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} /> : null}
        <main className="app-main">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
