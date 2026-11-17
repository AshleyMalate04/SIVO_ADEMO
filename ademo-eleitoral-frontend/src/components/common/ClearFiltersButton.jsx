import { RotateCcw } from 'lucide-react'

export default function ClearFiltersButton({ active = false, onClick }) {
  const clearFilters = () => {
    onClick?.()
    window.setTimeout(() => {
      document.querySelectorAll('select[data-search-enhanced="true"]').forEach((select) => {
        select.dispatchEvent(new Event('change'))
      })
    }, 0)
  }

  // Only offered when there is something to clear, instead of a permanently disabled button.
  if (!active) return null

  return (
    <button
      className="clear-filters-button"
      type="button"
      onClick={clearFilters}
      aria-label="Limpar filtros"
      title="Limpar filtros"
    >
      <RotateCcw size={18} aria-hidden="true" />
    </button>
  )
}
