export default function RequiredLabel({ children }) {
  return (
    <span className="required-label">
      {children} <strong className="required-mark">*</strong>
    </span>
  )
}
