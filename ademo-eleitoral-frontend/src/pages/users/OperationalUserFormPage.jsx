import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { notify } from '../../utils/notify'
import { userService } from '../../services/userService'
import { delegationService } from '../../services/delegationService'
import { getApiErrorMessage } from '../../utils/apiError'
import { onlyActive } from '../../utils/statusFilters'

const uppercaseName = (value) => value.replace(/\s+/g, ' ').toLocaleUpperCase('pt-PT')
const hasTwoWords = (value) => value.trim().split(/\s+/).length >= 2
export default function OperationalUserFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [delegations, setDelegations] = useState([])
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    delegationService.list()
      .then((records) => setDelegations(onlyActive(records)))
      .catch((error) => notify.error('Não foi possível carregar delegações.', error.response?.data?.message || 'Verifique a API.'))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    userService.show(id)
      .then((record) => setUser({ ...record, role: record.role === 'COMMISSION' ? 'COMISSAO' : record.role }))
      .catch((error) => notify.error('Não foi possível carregar o utilizador.', error.response?.data?.message || 'Verifique a API.'))
  }, [id, isEditing])

  const selectedRole = user?.role === 'COMMISSION' ? 'COMISSAO' : (user?.role ?? '')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: uppercaseName(formData.get('name')?.trim() || ''),
      access_code: formData.get('access_code')?.trim(),
      delegation_id: formData.get('delegation_id') ? Number(formData.get('delegation_id')) : null,
      phone: formData.get('phone')?.trim() || null,
      email: formData.get('email')?.trim().toLowerCase() || '',
      role: formData.get('role'),
      status: user?.status === 'BLOCKED' ? 'SUSPENDED' : (user?.status ?? 'ACTIVE'),
    }

    if (!payload.name || !payload.access_code || !payload.delegation_id || !payload.phone || !payload.email || !payload.role) {
      notify.error('Campos obrigatórios.', 'Preencha todos os campos obrigatórios, incluindo o email.')
      return
    }

    if (!hasTwoWords(payload.name)) {
      notify.error('Nome incompleto.', 'Informe o nome completo do utilizador, com pelo menos duas palavras.')
      return
    }

    if (payload.phone && !/^(82|83|84|85|86|87)[0-9]{7}$/.test(payload.phone)) {
      notify.error('Telefone inválido.', 'Informe um número moçambicano válido com 9 dígitos, começando por 82, 83, 84, 85, 86 ou 87.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      notify.error('Email inválido.', 'Informe um email válido.')
      return
    }

    try {
      setSaving(true)
      const savedUser = isEditing
        ? await userService.update(id, payload)
        : await userService.create(payload)
      if (savedUser?.initial_password) {
        notify.warning('Email não enviado.', `Partilhe estes dados de acesso manualmente: ${savedUser.access_code} / ${savedUser.initial_password}`)
      }
      notify.success(isEditing ? 'Dados do utilizador alterados.' : 'Utilizador registado com sucesso.')
      navigate('/comissao-fiscal')
    } catch (error) {
      notify.error('Utilizador não guardado.', getApiErrorMessage(error, payload))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão da comissão e fiscais</h1>
        <p>{isEditing ? 'Altere os dados do utilizador seleccionado.' : 'Registe membros da comissão ou fiscais. A palavra-passe inicial é 12345678 e deverá ser substituída no primeiro acesso.'}</p>
      </header>

      <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab" to="/comissao-fiscal">Visualizar</Link>
        <Link className="mode-tab active" to={isEditing ? `/comissao-fiscal/${id}/editar` : '/comissao-fiscal/novo'}>{isEditing ? 'Editar' : 'Registar'}</Link>
      </div>

      <form className="management-form-card" onSubmit={handleSubmit} key={user?.id ?? 'new-user'}>
        <div className="form-grid two-columns">
          <label className="form-field">
            <span>Nome</span>
            <input name="name" required placeholder="Nome completo" defaultValue={user?.name ?? ''} onInput={(event) => { event.currentTarget.value = uppercaseName(event.currentTarget.value) }} />
          </label>
          <label className="form-field select-field">
            <span>Delegação de origem</span>
            <select name="delegation_id" required value={user?.delegation_id ?? ''} onChange={(event) => setUser((current) => ({ ...(current ?? {}), delegation_id: event.target.value }))}>
              <option value="">Seleccione a delegação</option>
              {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Telefone</span>
            <input name="phone" required inputMode="numeric" placeholder="84XXXXXXX" defaultValue={user?.phone ?? ''} />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" placeholder="nome@exemplo.com" defaultValue={user?.email ?? ''} />
          </label>
          <label className="form-field select-field">
            <span>Perfil</span>
            <select name="role" required value={user?.role ?? ''} onChange={(event) => setUser((current) => ({ ...(current ?? {}), role: event.target.value }))}>
              <option value="" disabled>Seleccione o perfil</option>
              <option value="FISCAL">Fiscal</option>
              <option value="COMISSAO">Comissão</option>
            </select>
          </label>
          <label className="form-field">
            <span>Código de acesso</span>
            <input name="access_code" required defaultValue={user?.access_code ?? ''} placeholder={selectedRole === 'FISCAL' ? 'Ex.: FIS-0002' : selectedRole === 'COMISSAO' ? 'Ex.: COM-0002' : 'Introduza o código...'} />
          </label>
        </div>

        {!isEditing ? (
          <p className="form-help-text">Palavra-passe inicial: <strong>12345678</strong>. O utilizador deverá definir uma palavra-passe pessoal no primeiro acesso.</p>
        ) : null}

        <div className="form-footer">
          <Link className="secondary-button" to="/comissao-fiscal">Cancelar</Link>
          <button className="primary-action-button" type="submit" disabled={saving}>{saving ? 'A guardar...' : isEditing ? 'Alterar dados' : 'Guardar registo'}</button>
        </div>
      </form>
    </section>
  )
}
