import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { notify } from '../../utils/notify'
import { userService } from '../../services/userService'
import { delegationService } from '../../services/delegationService'
import { getApiErrorMessage } from '../../utils/apiError'
import { onlyActive } from '../../utils/statusFilters'

export default function OperationalUserFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [delegations, setDelegations] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    delegationService.list()
      .then((records) => setDelegations(onlyActive(records)))
      .catch((error) => notify.error('Não foi possível carregar delegações.', error.response?.data?.message || 'Verifique a API.'))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    userService.show(id)
      .then(setUser)
      .catch((error) => notify.error('Não foi possível carregar o utilizador.', error.response?.data?.message || 'Verifique a API.'))
  }, [id, isEditing])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: formData.get('name')?.trim(),
      access_code: formData.get('access_code')?.trim(),
      delegation_id: formData.get('delegation_id') ? Number(formData.get('delegation_id')) : null,
      phone: formData.get('phone')?.trim() || null,
      email: formData.get('email')?.trim() || null,
      role: formData.get('role'),
      status: user?.status === 'BLOCKED' ? 'SUSPENDED' : (user?.status ?? 'ACTIVE'),
    }

    try {
      if (isEditing) await userService.update(id, payload)
      else await userService.create(payload)
      notify.success(isEditing ? 'Dados do utilizador alterados.' : 'Utilizador registado com sucesso.')
      navigate('/comissao-fiscal')
    } catch (error) {
      notify.error('Utilizador não guardado.', getApiErrorMessage(error, payload))
    }
  }

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão Comissão e Fiscal</h1>
        <p>{isEditing ? 'Altere os dados do utilizador seleccionado.' : 'Registe membros da comissão ou fiscais. A palavra-passe inicial será 12345678 e, se houver email, o sistema enviará os dados de acesso.'}</p>
      </header>

      <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab" to="/comissao-fiscal">Visualizar</Link>
        <Link className="mode-tab active" to={isEditing ? `/comissao-fiscal/${id}/editar` : '/comissao-fiscal/novo'}>{isEditing ? 'Editar' : 'Registar'}</Link>
      </div>

      <form className="management-form-card" onSubmit={handleSubmit} key={user?.id ?? 'new-user'}>
        <div className="form-grid two-columns">
          <label className="form-field">
            <span>Nome</span>
            <input name="name" required defaultValue={user?.name ?? ''} />
          </label>
          <label className="form-field">
            <span>Código de acesso</span>
            <input name="access_code" required defaultValue={user?.access_code ?? ''} />
          </label>
          <label className="form-field select-field">
            <span>Delegação de Origem</span>
            <select name="delegation_id" value={user?.delegation_id ?? ''} onChange={(event) => setUser((current) => ({ ...(current ?? {}), delegation_id: event.target.value }))}>
              <option value="">Seleccione a delegação</option>
              {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Telefone</span>
            <input name="phone" data-optional="true" defaultValue={user?.phone ?? ''} />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input name="email" data-optional="true" type="email" defaultValue={user?.email ?? ''} />
          </label>
          <label className="form-field select-field">
            <span>Perfil</span>
            <select name="role" required value={user?.role ?? ''} onChange={(event) => setUser((current) => ({ ...(current ?? {}), role: event.target.value }))}>
              <option value="" disabled>Seleccione o perfil</option>
              <option value="FISCAL">Fiscal</option>
              <option value="COMISSAO">Comissão</option>
            </select>
          </label>
        </div>

        {!isEditing ? (
          <p className="form-help-text">A palavra-passe inicial será <strong>12345678</strong>. O utilizador poderá alterá-la em Configurações após a primeira sessão.</p>
        ) : null}

        <div className="form-footer">
          <Link className="secondary-button" to="/comissao-fiscal">Cancelar</Link>
          <button className="primary-action-button" type="submit">{isEditing ? 'Alterar dados' : 'Guardar registo'}</button>
        </div>
      </form>
    </section>
  )
}
