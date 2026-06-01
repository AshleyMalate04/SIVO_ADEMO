import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const icons = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
}

export default function FeedbackCard({
  title,
  message,
  type = 'success',
  children,
}) {
  const Icon = icons[type] ?? CheckCircle2

  return (
    <section className={`feedback-card ${type}`} role="status">
      <Icon size={24} />
      <div>
        <strong>{title}</strong>
        {message ? <p>{message}</p> : null}
        {children}
      </div>
    </section>
  )
}
