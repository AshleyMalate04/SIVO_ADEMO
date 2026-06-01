export default function Modal({ children, open = false, ...props }) {
  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" {...props}>
      {children}
    </div>
  )
}
