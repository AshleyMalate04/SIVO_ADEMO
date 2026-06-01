import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

export default function InternalPage({
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}) {
  return (
    <div className="content-page">
      <div className="content-page-header">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        <div className="page-actions">
          {secondaryAction ? (
            <Link className="secondary-button" to={secondaryAction.to}>
              {secondaryAction.label}
            </Link>
          ) : null}
          {primaryAction ? (
            <Link className="primary-action-button" to={primaryAction.to}>
              <Plus size={18} />
              {primaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="toolbar">
        <label className="toolbar-search">
          <Search size={18} />
          <input placeholder="Pesquisar" />
        </label>
      </div>

      {children ?? (
        <section className="simple-panel">
          <p>Conteudo desta tela sera ligado a API nas proximas etapas.</p>
        </section>
      )}
    </div>
  )
}
