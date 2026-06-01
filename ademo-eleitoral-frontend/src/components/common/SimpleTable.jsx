import { Eye, Pencil } from 'lucide-react'

const rows = [
  ['Mesa da Assembleia Geral', 'Maputo', 'Activo'],
  ['Conselho Fiscal', 'Maputo', 'Activo'],
  ['Conselho de Direcção', 'Maputo', 'Activo'],
]

export default function SimpleTable({ columns = ['Nome', 'Delegação', 'Estado'], canManage = false }) {
  return (
    <div className="table-card compact-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
            {canManage ? <th>Acções</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
              {canManage ? (
                <td>
                  <div className="actions-cell">
                    <button className="table-action" type="button" aria-label="Ver">
                      <Eye size={20} />
                    </button>
                    <button className="table-action" type="button" aria-label="Editar">
                      <Pencil size={20} />
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
