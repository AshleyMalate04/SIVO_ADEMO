export default function PageHeader({ title, description, actions }) {
  return (
    <header>
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  )
}
