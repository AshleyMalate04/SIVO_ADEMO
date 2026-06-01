import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function ManagementPagination({
  totalItems,
  page,
  pageSize = 7,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalItems <= pageSize || totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav className="table-pagination" aria-label="Paginação">
      <button
        className="pagination-edge"
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ArrowLeft size={18} /> Anterior
      </button>
      <div className="pagination-pages">
        {pages.map((pageNumber) => (
          <button
            className={pageNumber === page ? 'pagination-page active' : 'pagination-page'}
            type="button"
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button
        className="pagination-edge"
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        Próximo <ArrowRight size={18} />
      </button>
    </nav>
  )
}
