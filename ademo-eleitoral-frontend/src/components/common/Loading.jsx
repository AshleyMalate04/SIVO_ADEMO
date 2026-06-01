export default function Loading({ label = 'Carregando...' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span></span>
      <p>{label}</p>
    </div>
  )
}
