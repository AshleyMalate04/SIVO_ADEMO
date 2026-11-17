import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ManagementPagination({
  totalItems,
  page,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)

  const availablePageSizes = [...new Set([...pageSizeOptions, pageSize])]
    .map(Number)
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((first, second) => first - second)

  return (
    <nav className="management-pagination" aria-label="Paginação">
      {onPageSizeChange ? (
        <label className="management-pagination__size">
          <select
            aria-label="Número de registos por página"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {availablePageSizes.map((size) => <option value={size} key={size}>{size} por página</option>)}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
      ) : null}
      <button
        className="management-pagination__arrow"
        type="button"
        aria-label="Página anterior"
        title="Página anterior"
        disabled={safePage === 1}
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <span
        className="management-pagination__current"
        aria-current="page"
        aria-label={`Página ${safePage} de ${totalPages}`}
        title={`Página ${safePage} de ${totalPages}`}
      >
        {safePage}
      </span>
      <button
        className="management-pagination__arrow"
        type="button"
        aria-label="Próxima página"
        title="Próxima página"
        disabled={safePage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  )
}
