import { Eye, Pencil, Power } from 'lucide-react'
import { notify } from '../../utils/notify'

export default function ActionButtons({ label = 'registo', canManage = true }) {
  if (!canManage) return null

  return (
    <div className="actions-cell">
      <button
        className="table-action"
        type="button"
        aria-label={`Suspender ${label}`}
        onClick={() => notify.info(`${label} marcado como suspenso.`)}
      >
        <Power size={20} />
      </button>
      <button
        className="table-action"
        type="button"
        aria-label={`Editar ${label}`}
        onClick={() => notify.info('Editar')}
      >
        <Pencil size={20} />
      </button>
      <button className="table-action" type="button" aria-label={`Ver ${label}`}>
        <Eye size={20} />
      </button>
    </div>
  )
}
