import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle2, Clock3, Eye, Megaphone, Search, Trash2, Trophy, Vote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Loading from '../../components/common/Loading'
import ManagementPagination from '../../components/common/ManagementPagination'
import { notificationService } from '../../services/notificationService'
import { notify } from '../../utils/notify'
import { formatDateTime } from '../../utils/localDateTime'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'

const getIcon = (type, title = '') => {
  const text = `${type} ${title}`.toLowerCase()
  if (text.includes('resultado')) return Trophy
  if (text.includes('conclu')) return CheckCircle2
  if (text.includes('terminar') || text.includes('hora')) return Clock3
  if (text.includes('elei') || text.includes('vota')) return Vote
  return Megaphone
}

const normaliseNotification = (notification) => ({
  id: notification.id,
  title: notification.title ?? 'Notificação',
  message: notification.message ?? '',
  type: notification.type ?? 'INFO',
  electionId: notification.election_id ?? notification.electionId ?? null,
  sentAt: formatDateTime(notification.created_at),
  read: Boolean(notification.read_at),
  Icon: getIcon(notification.type, notification.title),
})

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const pageSize = 7

  const loadNotifications = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const records = await notificationService.list()
      setNotifications(records.map(normaliseNotification))
    } catch (error) {
      notify.error('Não foi possível carregar as notificações.', error.response?.data?.message || 'Verifique a ligação com a API.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useRealtimeNotifications({
    onNotification: (payload) => {
      const notification = normaliseNotification(payload.notification ?? payload)
      setNotifications((current) => {
        if (!notification.id || current.some((item) => item.id === notification.id)) return current
        return [notification, ...current]
      })
      notify.success(notification.title, notification.message)
    },
    onRefresh: () => loadNotifications({ silent: true }),
  })

  useEffect(() => {
    loadNotifications()
    const timer = window.setInterval(() => loadNotifications({ silent: true }), 60000)
    const handleFocus = () => loadNotifications({ silent: true })
    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const filteredNotifications = useMemo(() => {
    const term = query.trim().toLowerCase()
    return notifications.filter((notification) => {
      const matchesQuery = !term || `${notification.title} ${notification.message} ${notification.type}`.toLowerCase().includes(term)
      const matchesFilter = filter === 'all' || !notification.read
      return matchesQuery && matchesFilter
    })
  }, [filter, notifications, query])

  const visibleNotifications = filteredNotifications.slice((page - 1) * pageSize, page * pageSize)

  const markAsRead = async (id) => {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification))
    try {
      await notificationService.markAsRead(id)
    } catch (error) {
      notify.error('Não foi possível marcar a notificação como lida.', error.response?.data?.message || 'Tente novamente.')
    }
  }

  const deleteNotification = async (id) => {
    const previous = notifications
    setNotifications((current) => current.filter((notification) => notification.id !== id))
    try {
      await notificationService.remove(id)
      notify.success('Notificação eliminada.')
    } catch (error) {
      setNotifications(previous)
      notify.error('Não foi possível eliminar a notificação.', error.response?.data?.message || 'Tente novamente.')
    }
  }

  const markAllAsRead = async () => {
    const previous = notifications
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
    try {
      await notificationService.markAllAsRead()
      notify.success('Notificações actualizadas.', 'Todas foram marcadas como lidas.')
    } catch (error) {
      setNotifications(previous)
      notify.error('Não foi possível actualizar as notificações.', error.response?.data?.message || 'Tente novamente.')
    }
  }

  const openNotification = async (notification) => {
    await markAsRead(notification.id)
    if (notification.electionId) {
      navigate(`/portal-eleitor/resultados?eleição=${notification.electionId}`)
      return
    }
    navigate('/portal-eleitor/votacoes')
  }

  if (loading) return <Loading label="A carregar notificações..." />

  return (
    <section className="management-page notifications-page">
      <div className="management-title-row">
        <header className="management-header">
          <h1>Notificações</h1>
          <p>Acompanhe avisos sobre início da votação, alerta de término, conclusão e publicação de resultados.</p>
        </header>
        <button className="primary-action-button top-create-button" type="button" onClick={markAllAsRead} disabled={!notifications.some((item) => !item.read)}>
          <Bell size={18} />
          Marcar todas como lidas
        </button>
      </div>

      <section className="notification-toolbar">
        <label className="filter-field filter-search">
          <Search size={18} />
          <input
            placeholder="Pesquisar notificações..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>
        <div className="segmented-filter">
          <button className={filter === 'all' ? 'active' : ''} type="button" onClick={() => { setFilter('all'); setPage(1) }}>Todas</button>
          <button className={filter === 'unread' ? 'active' : ''} type="button" onClick={() => { setFilter('unread'); setPage(1) }}>Não lidas</button>
        </div>
      </section>

      <section className="notification-list">
        {visibleNotifications.length === 0 ? (
          <article className="notification-card read empty-notification-card">
            <div className="notification-icon"><Bell size={18} /></div>
            <div>
              <h2>Sem notificações</h2>
              <p>Quando houver início de votação, aviso de término, conclusão ou resultados publicados, aparecerá aqui.</p>
            </div>
          </article>
        ) : null}
        {visibleNotifications.map((notification) => {
          const { id, title, message, sentAt, read, Icon } = notification
          return (
            <article className={read ? 'notification-card read' : 'notification-card'} key={id}>
              <div className="notification-icon"><Icon size={18} /></div>
              <div>
                <h2>{title}</h2>
                <p>{message}</p>
              </div>
              <time>{sentAt}</time>
              <div className="notification-actions">
                <button type="button" onClick={() => openNotification(notification)}>
                  <Eye size={16} /> Consultar
                </button>
                <button className="danger-link" type="button" onClick={() => deleteNotification(id)}>
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <footer className="notification-footer">
        <span>Mostrando {visibleNotifications.length} de {filteredNotifications.length} notificações</span>
        {filteredNotifications.length > pageSize ? <ManagementPagination totalItems={filteredNotifications.length} page={page} pageSize={pageSize} onPageChange={setPage} /> : null}
      </footer>
    </section>
  )
}
