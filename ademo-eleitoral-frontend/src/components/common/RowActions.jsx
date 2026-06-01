import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Power, Trash2, XCircle } from 'lucide-react'
import { createPortal } from 'react-dom'

function ActionModal({ details = [], mode, title, onClose, onConfirm }) {
  const isDelete = mode === 'delete'
  const isSuspend = mode === 'suspend'
  const isActivate = mode === 'activate'
  const isEdit = mode === 'edit'

  const heading = mode === 'view'
    ? 'Informações detalhadas'
    : isEdit
      ? 'Editar registo'
      : isActivate
        ? 'Activar registo'
        : isSuspend
          ? 'Suspender registo'
          : 'Confirmar eliminação'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="action-dialog professional-modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Fechar" onClick={onClose}>
          <XCircle size={22} />
        </button>
        <header className="action-dialog-header">
          <div>
            <span className="modal-kicker">Consulta</span>
            <h2>{heading}</h2>
            <p>{title}</p>
          </div>
        </header>

        {mode === 'view' ? (
          <div className="detail-grid">
            {details.map(([label, value], index) => (
              <p className={index === details.length - 1 || label === 'Descrição' ? 'full' : ''} key={`${label}-${value}`}>
                <span>{label}</span>
                <strong>{value}</strong>
              </p>
            ))}
          </div>
        ) : null}

        {isEdit ? (
          <form className="detail-grid">
            <label><span>Nome</span><input defaultValue={title} /></label>
            <label><span>Estado</span><select defaultValue="Activo"><option>Activo</option><option>Suspenso</option></select></label>
            <label className="full"><span>Observação</span><textarea defaultValue="Informações actuais do registo." /></label>
          </form>
        ) : null}

        {isSuspend ? (
          <div className="danger-note">
            <strong>Deseja suspender este registo?</strong>
            <p>O registo ficará indisponível para novas operações até ser reactivado por um perfil autorizado.</p>
          </div>
        ) : null}

        {isActivate ? (
          <div className="danger-note info-note">
            <strong>Deseja activar este registo?</strong>
            <p>O registo voltará a estar disponível para operações permitidas.</p>
          </div>
        ) : null}

        {isDelete ? (
          <div className="danger-note">
            <strong>Tem certeza que deseja eliminar este registo?</strong>
            <p>Esta acção pode remover informações associadas e deve ser confirmada apenas quando for realmente necessária.</p>
          </div>
        ) : null}

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
          {mode === 'view' ? <button className="primary-action-button" type="button" onClick={onClose}>Fechar</button> : null}
          {isEdit ? <button className="primary-action-button" type="button" onClick={onClose}>Guardar alterações</button> : null}
          {isActivate ? <button className="primary-action-button" type="button" onClick={onConfirm}>Activar</button> : null}
          {isSuspend ? <button className="danger-action-button" type="button" onClick={onConfirm}>Suspender</button> : null}
          {isDelete ? <button className="danger-action-button" type="button" onClick={onConfirm}>Eliminar</button> : null}
        </div>
      </div>
    </div>
  )
}

export default function RowActions({
  canManage = false,
  details = [],
  title = 'Registo seleccionado',
  editTo,
  isInactive = false,
  hideDelete = false,
  onInactivate,
  onActivate,
  onDelete,
  disableEdit = false,
  disableStatus = false,
  disableDelete = false,
  onView,
  hideView = false,
}) {
  const [mode, setMode] = useState(null)
  const canToggleStatus = Boolean(onInactivate || onActivate)
  const editDisabled = !canManage || !editTo || disableEdit
  const statusDisabled = !canManage || !canToggleStatus || disableStatus
  const deleteDisabled = !canManage || !onDelete || disableDelete

  const confirmAction = async () => {
    if (mode === 'activate') await onActivate?.()
    if (mode === 'suspend') await onInactivate?.()
    if (mode === 'delete') await onDelete?.()
    setMode(null)
  }

  // return (
  //   <div className="actions-cell">
  //     {!hideView ? (
  //       <button className="table-action" type="button" aria-label="Consultar" onClick={() => (onView ? onView() : setMode('view'))}>
  //         <Eye size={22} />
  //       </button>
  //     ) : null}
  //     {editTo && !editDisabled ? (
  //       <Link className="table-action" to={editTo} aria-label="Editar">
  //         <Pencil size={21} />
  //       </Link>
  //     ) : null}
  //     {!editTo || editDisabled ? null : null}
  //     {!statusDisabled ? (
  //       <button className="table-action suspend-action" type="button" aria-label={isInactive ? 'Activar' : 'Suspender'} onClick={() => setMode(isInactive ? 'activate' : 'suspend')}>
  //         <Power size={20} />
  //       </button>
  //     ) : null}
  //     {!hideDelete && !deleteDisabled ? (
  //       <button className="table-action" type="button" aria-label="Eliminar" disabled={deleteDisabled} onClick={() => setMode('delete')}>
  //         <Trash2 size={20} />
  //       </button>
  //     ) : null}
  //     {mode ? <ActionModal details={details} mode={mode} title={title} onClose={() => setMode(null)} onConfirm={confirmAction} /> : null}
  //   </div>
  // )
  return (
  <div className="actions-cell">
    {!hideView ? (
      <button
        className="table-action"
        type="button"
        aria-label="Consultar"
        onClick={() => (onView ? onView() : setMode('view'))}
      >
        <Eye size={22} />
      </button>
    ) : null}

    {editTo && !editDisabled ? (
      <Link className="table-action" to={editTo} aria-label="Editar">
        <Pencil size={21} />
      </Link>
    ) : null}

    {!statusDisabled ? (
      <button
        className="table-action suspend-action"
        type="button"
        aria-label={isInactive ? 'Activar' : 'Suspender'}
        onClick={() => setMode(isInactive ? 'activate' : 'suspend')}
      >
        <Power size={20} />
      </button>
    ) : null}

    {!hideDelete && !deleteDisabled ? (
      <button
        className="table-action"
        type="button"
        aria-label="Eliminar"
        disabled={deleteDisabled}
        onClick={() => setMode('delete')}
      >
        <Trash2 size={20} />
      </button>
    ) : null}

    {mode
      ? createPortal(
          <ActionModal
            details={details}
            mode={mode}
            title={title}
            onClose={() => setMode(null)}
            onConfirm={confirmAction}
          />,
          document.body
        )
      : null}
  </div>
)
}
