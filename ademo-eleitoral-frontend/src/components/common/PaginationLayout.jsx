import { useEffect, useMemo, useState } from 'react'
import ManagementPagination from './ManagementPagination'

const DEFAULT_PAGE_SIZE = 7

export default function PaginationLayout({
  children,
  items,
  pageSize = DEFAULT_PAGE_SIZE,
  summaryLabel = 'resultados',
}) {
  const [page, setPage] = useState(1)
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

  return (
    <div>
      {children(pageItems)}
      <footer className="table-footer">
        <span>A mostrar {start} a {end} de {totalItems} {summaryLabel}</span>
        {totalItems > pageSize ? (
          <ManagementPagination
            totalItems={totalItems}
            page={safePage}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        ) : null}
      </footer>
    </div>
  )
}
