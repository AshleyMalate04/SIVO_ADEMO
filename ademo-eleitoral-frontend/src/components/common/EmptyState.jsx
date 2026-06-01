export default function EmptyState({ title = 'Sem dados', description }) {
  return (
    <div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
