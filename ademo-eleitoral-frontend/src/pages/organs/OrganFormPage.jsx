import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { notify } from '../../utils/notify'
import { organService } from '../../services/organService'

const defaultPositions = ['Presidente', 'Vice-presidente', 'Secretario'].map((name) => ({
  id: null,
  name,
  status: 'ACTIVE',
  removed: false,
}))

export default function OrganFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [positions, setPositions] = useState(defaultPositions)
  const [newPosition, setNewPosition] = useState('')
  const [organ, setOrgan] = useState(null)

  useEffect(() => {
    if (!isEditing) return
    organService.show(id)
      .then((record) => {
        setOrgan(record)
        setPositions((record.positions ?? [])
          .filter((position) => position.status === 'ACTIVE')
          .map((position) => ({
            id: position.id,
            name: position.name,
            status: position.status,
            removed: false,
          })))
      })
      .catch((error) => notify.error('Não foi possível carregar o órgão.', error.response?.data?.message || 'Verifique a API.'))
  }, [id, isEditing])

  const visiblePositions = useMemo(() => positions.filter((position) => !position.removed), [positions])

  const addPosition = () => {
    const name = newPosition.trim()
    if (!name) return
    if (visiblePositions.some((position) => position.name.toLowerCase() === name.toLowerCase())) {
      notify.warning('Cargo já adicionado.')
      return
    }
    setPositions((current) => [...current, { id: null, name, status: 'ACTIVE', removed: false }])
    setNewPosition('')
  }

  const updatePositionName = (index, name) => {
    setPositions((current) => current.map((position, itemIndex) => itemIndex === index ? { ...position, name } : position))
  }

  const removePosition = (index) => {
    setPositions((current) => current.map((position, itemIndex) => itemIndex === index ? { ...position, removed: true } : position))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name')?.trim()
    const description = formData.get('description')?.trim() || null
    const validPositions = positions
      .filter((position) => !position.removed)
      .map((position) => ({ ...position, name: position.name.trim() }))
      .filter((position) => position.name)

    if (!name) {
      notify.error('Nome obrigatório.', 'Informe o nome do órgão.')
      return
    }

    if (!validPositions.length) {
      notify.error('Cargo obrigatório.', 'Adicione pelo menos um cargo ao órgão.')
      return
    }

    try {
      const savedOrgan = isEditing
        ? await organService.update(id, { name, description, status: organ?.status ?? 'ACTIVE' })
        : await organService.create({ name, description, status: 'ACTIVE' })

      await Promise.all(positions.map((position) => {
        if (position.removed && position.id) return organService.removePosition(position.id)
        if (position.removed) return Promise.resolve()
        const payload = {
          organ_id: savedOrgan.id,
          name: position.name.trim(),
          status: 'ACTIVE',
        }
        if (position.id) return organService.updatePosition(position.id, payload)
        return organService.addPosition(savedOrgan.id, payload)
      }))

      notify.success(isEditing ? 'Órgão e cargos alterados.' : 'Órgão e cargos registados com sucesso.')
      navigate('/orgaos-cargos')
    } catch (error) {
      notify.error('Órgão não guardado.', error.response?.data?.message || 'Verifique os campos informados.')
    }
  }

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de Órgãos e Cargos</h1>
        <p>{isEditing ? 'Altere o órgão e os seus cargos.' : 'Estrutura eleitoral dinâmica e configurável.'}</p>
      </header>

      <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab" to="/orgaos-cargos">Visualizar</Link>
        <Link className="mode-tab active" to={isEditing ? `/orgaos-cargos/${id}/editar` : '/orgaos-cargos/novo'}>{isEditing ? 'Editar' : 'Registar'}</Link>
      </div>

      <form className="management-form-card organ-form-card" onSubmit={handleSubmit} key={organ?.id ?? 'new-organ'} noValidate>
        <h2>{isEditing ? 'Editar órgão' : 'Novo órgão'}</h2>
        <label className="form-field organ-name-field">
          <span>Nome do órgão</span>
          <input name="name" placeholder="Nome do órgão" defaultValue={organ?.name ?? ''} />
        </label>

        <label className="form-field">
          <span>Descrição</span>
          <textarea name="description" data-optional="true" placeholder="Descreva a finalidade deste órgão." defaultValue={organ?.description ?? ''} />
        </label>

        <section className="roles-panel">
          <h2>Cargos</h2>
          <label className="form-field role-input">
            <span>Novo cargo</span>
            <input data-optional="true" value={newPosition} onChange={(event) => setNewPosition(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addPosition()
              }
            }} />
          </label>
          <button className="secondary-button add-role-button" type="button" onClick={addPosition}>
            <Plus size={21} />
            Adicionar cargo
          </button>

          <div className="role-list">
            {positions.map((position, index) => position.removed ? null : (
              <div className="role-row editable-role-row" key={`${position.id ?? 'new'}-${index}`}>
                <input value={position.name} onChange={(event) => updatePositionName(index, event.target.value)} aria-label="Nome do cargo" />
                <button type="button" aria-label={`Eliminar ${position.name}`} onClick={() => removePosition(index)}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="form-footer">
          <Link className="secondary-button" to="/orgaos-cargos">Cancelar</Link>
          <button className="primary-action-button" type="submit">{isEditing ? 'Alterar dados' : 'Guardar órgão'}</button>
        </div>
      </form>
    </section>
  )
}
