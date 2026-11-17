import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, MoreVertical, Pencil, Power, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { notify } from '../../utils/notify'

function ActionModal({ details = [], mode, title, onClose, onConfirm }) {
  const isDelete = mode === 'delete'
  const isSuspend = mode === 'suspend'
  const isActivate = mode === 'activate'
  const heading = mode === 'view' ? 'Informações detalhadas' : isActivate ? 'Activar registo' : isSuspend ? 'Suspender registo' : 'Confirmar eliminação'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="action-dialog professional-modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        <header className="action-dialog-header"><div><h2>{heading}</h2><p>{title}</p></div></header>
        {mode === 'view' ? (
          <div className="detail-grid">
            {details.map(([label, value], index) => <p className={index === details.length - 1 || label === 'Descrição' ? 'full' : ''} key={`${label}-${value}`}><span>{label}</span><strong>{value}</strong></p>)}
          </div>
        ) : null}
        {isSuspend ? <div className="danger-note"><strong>Suspender este registo?</strong><p>O registo ficará indisponível para novas operações até ser reactivado.</p></div> : null}
        {isActivate ? <div className="danger-note info-note"><strong>Activar este registo?</strong><p>O registo voltará a estar disponível para as operações permitidas.</p></div> : null}
        {isDelete ? <div className="danger-note"><strong>Eliminar este registo?</strong><p>Esta acção pode remover informações associadas.</p></div> : null}
        <div className="modal-actions">
          {mode !== 'view' ? <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button> : null}
          {mode === 'view' ? <button className="primary-action-button" type="button" onClick={onClose}>Fechar</button> : null}
          {isActivate ? <button className="primary-action-button" type="button" onClick={onConfirm}>Activar</button> : null}
          {isSuspend ? <button className="danger-action-button" type="button" onClick={onConfirm}>Suspender</button> : null}
          {isDelete ? <button className="danger-action-button" type="button" onClick={onConfirm}>Eliminar</button> : null}
        </div>
      </div>
    </div>
  )
}

export default function RowActions({ canManage = false, details = [], title = 'Registo seleccionado', editTo, isInactive = false, hideDelete = false, onInactivate, onActivate, onDelete, disableEdit = false, disableStatus = false, disableDelete = false, onView, hideView = false }) {
  const [mode, setMode] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 12 })
  const triggerRef = useRef(null)
  const canToggleStatus = Boolean(onInactivate || onActivate)
  const editDisabled = !canManage || !editTo || disableEdit
  const statusDisabled = !canManage || !canToggleStatus || disableStatus
  const deleteDisabled = !canManage || !onDelete || disableDelete

  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (event) => {
      if (!event.target.closest?.('.row-actions-popover') && !triggerRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeOnViewportChange = () => setMenuOpen(false)
    document.addEventListener('pointerdown', close)
    window.addEventListener('resize', closeOnViewportChange)
    window.addEventListener('scroll', closeOnViewportChange, true)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', closeOnViewportChange)
      window.removeEventListener('scroll', closeOnViewportChange, true)
    }
  }, [menuOpen])

  const toggleMenu = () => {
    if (!menuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const top = rect.bottom + 202 > window.innerHeight ? Math.max(10, rect.top - 192) : rect.bottom + 6
      setMenuPosition({ top, right: Math.max(12, window.innerWidth - rect.right) })
    }
    setMenuOpen((current) => !current)
  }

  const chooseMode = (nextMode) => {
    setMenuOpen(false)
    if (nextMode === 'view' && onView) onView()
    else setMode(nextMode)
  }

  const confirmAction = async () => {
    try {
      if (mode === 'activate') await onActivate?.()
      if (mode === 'suspend') await onInactivate?.()
      if (mode === 'delete') await onDelete?.()
      setMode(null)
    } catch (error) {
      notify.error('Acção não realizada.', error.response?.data?.message || 'Verifique a API e tente novamente.')
    }
  }

  const menu = menuOpen ? createPortal(
    <div className="row-actions-popover" style={menuPosition} role="menu" aria-label={`Acções de ${title}`}>
      {!hideView ? <button type="button" role="menuitem" onClick={() => chooseMode('view')}><Eye size={17} />Consultar</button> : null}
      {!editDisabled ? <Link role="menuitem" to={editTo} onClick={() => setMenuOpen(false)}><Pencil size={17} />Editar</Link> : null}
      {!statusDisabled ? <button type="button" role="menuitem" onClick={() => chooseMode(isInactive ? 'activate' : 'suspend')}><Power size={17} />{isInactive ? 'Activar' : 'Suspender'}</button> : null}
      {!hideDelete && !deleteDisabled ? <button className="danger" type="button" role="menuitem" onClick={() => chooseMode('delete')}><Trash2 size={17} />Eliminar</button> : null}
    </div>, document.body,
  ) : null

  return (
    <div className="actions-cell compact-actions-cell">
      <button ref={triggerRef} className="table-action table-actions-trigger" type="button" aria-label="Abrir acções" aria-haspopup="menu" aria-expanded={menuOpen} onClick={toggleMenu}><MoreVertical size={20} /></button>
      <div className="mobile-row-actions" aria-label={`Acções de ${title}`}>
        {!hideView ? <button className="table-action" type="button" aria-label="Consultar" onClick={() => chooseMode('view')}><Eye size={18} /></button> : null}
        {!editDisabled ? <Link className="table-action" to={editTo} aria-label="Editar"><Pencil size={18} /></Link> : null}
        {!statusDisabled ? <button className="table-action" type="button" aria-label={isInactive ? 'Activar' : 'Suspender'} onClick={() => chooseMode(isInactive ? 'activate' : 'suspend')}><Power size={18} /></button> : null}
        {!hideDelete && !deleteDisabled ? <button className="table-action danger" type="button" aria-label="Eliminar" onClick={() => chooseMode('delete')}><Trash2 size={18} /></button> : null}
      </div>
      {menu}
      {mode ? createPortal(<ActionModal details={details} mode={mode} title={title} onClose={() => setMode(null)} onConfirm={confirmAction} />, document.body) : null}
    </div>
  )
}
