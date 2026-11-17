import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { getRoleLabel } from '../../constants/roles'
import { getAuthUser } from '../../lib/storage'

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

const normalizeFieldText = (value = '') => String(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const getFieldKind = (element) => {
  const field = element.closest?.('.form-field, .filter-field, .select-field')
  const explicitKind = element.dataset?.fieldKind || field?.dataset?.fieldKind
  if (explicitKind) return explicitKind
  const optionText = element.tagName === 'SELECT' ? Array.from(element.options).map((option) => option.textContent).join(' ') : ''
  const text = normalizeFieldText(`${element.name || ''} ${element.id || ''} ${element.type || ''} ${optionText} ${field?.textContent || ''}`)

  if (element.type === 'password' || text.includes('palavra-passe') || text.includes('senha')) return 'lock'
  if (element.type === 'email' || text.includes('email')) return 'email'
  if (element.type === 'tel' || text.includes('telefone') || text.includes('contacto')) return 'phone'
  if (element.type === 'date' || element.type === 'datetime-local' || /\b(data|inicio|fim)\b/.test(text)) return 'calendar'
  if (element.type === 'number' || /\b(total|numero|votos?)\b/.test(text)) return 'number'
  if (text.includes('delegacao') || text.includes('provincia') || text.includes('distrito') || text.includes('endereco')) return 'location'
  if (text.includes('estado') || text.includes('status')) return 'status'
  if (text.includes('perfil') || text.includes('papel')) return 'role'
  if (text.includes('orgao') || text.includes('cargo')) return 'organization'
  if (text.includes('eleicao') || text.includes('votacao') || text.includes('titulo')) return 'election'
  if (text.includes('codigo') || text.includes('identificacao') || text.includes('bi number') || text.includes('bi_')) return 'identity'
  if (text.includes('descricao') || text.includes('biografia') || text.includes('proposta')) return 'text'
  if (text.includes('nome') || text.includes('membro') || text.includes('candidato')) return 'person'
  return 'text'
}

export default function AppLayout({ children }) {
  const [authUser, setAuthUser] = useState(() => getAuthUser())
  const currentUser = authUser
    ? {
        name: authUser.name,
        role: authUser.role,
        roleLabel: getRoleLabel(authUser.role),
      }
    : null

  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const refreshUser = () => setAuthUser(getAuthUser())
    window.addEventListener('ademo-user-updated', refreshUser)
    return () => window.removeEventListener('ademo-user-updated', refreshUser)
  }, [])

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
        if (wrapper !== except) {
          wrapper.classList.remove('open')
          wrapper.querySelector('.searchable-select-trigger')?.setAttribute('aria-expanded', 'false')
        }
      })
    }

    const enhanceSelects = () => {
      document.querySelectorAll('select').forEach((select) => {
        // Keep this utility native: a searchable wrapper breaks the compact
        // pagination footer on narrow screens.
        if (select.closest('.management-pagination__size')) return

        if (select.dataset.searchEnhanced === 'true') {
          select.closest('.searchable-select')?.classList.toggle('unified-form-select', Boolean(select.closest('.form-field')))
          return
        }

        const wrapper = document.createElement('div')
        wrapper.className = select.closest('.form-field')
          ? 'searchable-select unified-form-select'
          : 'searchable-select'
        wrapper.dataset.fieldKind = getFieldKind(select)
        const trigger = document.createElement('button')
        trigger.type = 'button'
        trigger.className = 'searchable-select-trigger'
        trigger.setAttribute('aria-haspopup', 'listbox')
        trigger.setAttribute('aria-expanded', 'false')
        const panel = document.createElement('div')
        panel.className = 'searchable-select-panel'
        const input = document.createElement('input')
        input.type = 'search'
        input.className = 'searchable-select-input'
        input.placeholder = 'Pesquisar opções...'
        const list = document.createElement('div')
        list.className = 'searchable-select-options'
        list.setAttribute('role', 'listbox')

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
          if (label.includes('delega')) firstOption.textContent = 'Selecionar delegação...'
          else if (label.includes('prov')) firstOption.textContent = 'Selecionar província...'
          else if (label.includes('elei')) firstOption.textContent = 'Selecionar eleição...'
          else if (label.includes('cargo')) firstOption.textContent = 'Selecionar cargo...'
          else if (label.includes('perfil')) firstOption.textContent = 'Selecionar perfil...'
          else if (label.includes('estado')) firstOption.textContent = 'Selecionar estado...'
          else if (label.includes('tipo') || label.includes('acção') || label.includes('acao')) firstOption.textContent = 'Selecionar tipo...'
          else firstOption.textContent = 'Selecionar opção...'
        } else if (firstOption && firstOption.value === '') {
          const placeholders = {
            role: 'Selecionar perfil...',
            status: 'Selecionar estado...',
            location: 'Selecionar localização...',
            election: 'Selecionar eleição...',
            organization: 'Selecionar opção...',
            person: 'Selecionar pessoa...',
          }
          firstOption.textContent = placeholders[wrapper.dataset.fieldKind] || 'Selecionar opção...'
        }

        const readOptions = () =>
          Array.from(select.options).map((option) => ({
            text: option.textContent,
            value: option.value,
            disabled: option.disabled,
          }))

        const updateLabel = () => {
          const selected = select.options[select.selectedIndex]
          const selectedText = selected?.textContent?.trim() || ''
          const genericEmptyLabel = select.value === '' && normalize(selectedText) === 'todos'
          const emptyLabels = {
            role: 'Todos os perfis',
            status: 'Todos os estados',
            location: 'Todas as localizações',
            election: 'Todas as eleições',
            organization: 'Todos os órgãos ou cargos',
          }
          trigger.textContent = genericEmptyLabel ? (emptyLabels[wrapper.dataset.fieldKind] || 'Todos') : (selectedText || 'Seleccione')
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
            item.setAttribute('role', 'option')
            item.setAttribute('aria-selected', option.value === select.value ? 'true' : 'false')
            item.addEventListener('click', () => {
              if (option.disabled) return
              select.value = option.value
              updateLabel()
              select.dispatchEvent(new Event('change', { bubbles: true }))
              wrapper.classList.remove('open')
              trigger.setAttribute('aria-expanded', 'false')
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
          trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false')
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
    const markFormFields = () => {
      document.querySelectorAll('.management-form-card .form-field, .filters-panel .filter-field:not(.filter-search), .auth-form .form-field').forEach((field) => {
        const control = field.querySelector('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select')
        if (control) field.dataset.fieldKind = getFieldKind(control)
      })
    }

    markFormFields()
    const observer = new MutationObserver(markFormFields)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const applyControlPlaceholders = () => {
      document.querySelectorAll('input, textarea').forEach((control) => {
        const ignoredTypes = ['checkbox', 'radio', 'hidden', 'file', 'submit', 'button', 'reset']
        if (ignoredTypes.includes(control.type) || control.hasAttribute('placeholder')) return

        const label = control.closest('label')?.querySelector('span, .required-label')?.textContent?.trim()
        control.setAttribute('placeholder', label ? `Introduza ${label.toLowerCase()}` : 'Introduza um valor')
      })
    }

    applyControlPlaceholders()
    const observer = new MutationObserver(applyControlPlaceholders)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
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

  useEffect(() => {
    const markEmptyStates = () => {
      document.querySelectorAll('.empty-table-message').forEach((element) => {
        const text = normalizeFieldText(element.textContent)
        let kind = 'records'
        if (text.includes('auditor')) kind = 'audit'
        else if (text.includes('deleg')) kind = 'delegation'
        else if (text.includes('orgao') || text.includes('cargo')) kind = 'organization'
        else if (text.includes('candidat')) kind = 'candidate'
        else if (text.includes('eleitor')) kind = 'voter'
        else if (text.includes('eleicao')) kind = 'election'
        else if (text.includes('membro') || text.includes('utilizador')) kind = 'people'
        else if (text.includes('resultado')) kind = 'results'
        element.dataset.emptyKind = kind
      })
    }

    markEmptyStates()
    const observer = new MutationObserver(markEmptyStates)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="app-shell staff-shell">
      <Header
        user={currentUser}
        scrolled={headerScrolled}
        showMenuButton
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
