import { useEffect, useMemo, useState } from 'react'
import ManagementPagination from './ManagementPagination'

const DEFAULT_PAGE_SIZE = 25

export default function PaginationLayout({
  children,
  items,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  summaryLabel = 'resultados',
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(Math.max(1, initialPageSize))

  useEffect(() => {
    setPage(1)
  }, [items])

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, pageSize, safePage])

  const start = totalItems ? (safePage - 1) * pageSize + 1 : 0
  const end = Math.min(safePage * pageSize, totalItems)
  const handlePageSizeChange = (nextPageSize) => {
    setPageSize(nextPageSize)
    setPage(1)
  }

  return (
    <div>
      {children(pageItems)}
      <footer className="table-footer">
        <span className="table-footer__summary" aria-label={`${start}-${end} de ${totalItems} ${summaryLabel}`}>
          <strong>{start}-{end} de {totalItems}</strong><span className="table-footer__summary-label">{summaryLabel}</span>
        </span>
        <ManagementPagination
          totalItems={totalItems}
          page={safePage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </footer>
    </div>
  )
}
