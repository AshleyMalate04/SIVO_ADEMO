export default function Pagination({ children, ...props }) {
  return <nav aria-label="Paginação" {...props}>{children}</nav>
}
