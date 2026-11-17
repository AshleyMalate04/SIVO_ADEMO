export default function Loading({ label = 'A carregar...' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span></span>
      <p>{label}</p>
    </div>
  )
}
