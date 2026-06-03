import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { delegationService } from '../../services/delegationService'
import { memberService } from '../../services/memberService'
import { getApiErrorMessage } from '../../utils/apiError'
import { notify } from '../../utils/notify'
import { onlyActive } from '../../utils/statusFilters'

const uppercaseName = (value) => value.replace(/\s+/g, ' ').toLocaleUpperCase('pt-PT')
const hasTwoWords = (value) => value.trim().split(/\s+/).length >= 2

export default function MemberFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [delegations, setDelegations] = useState([])
  const [member, setMember] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    delegationService.list()
      .then((records) => setDelegations(onlyActive(records)))
      .catch((error) => notify.error('Não foi possível carregar delegações.', error.response?.data?.message || 'Verifique a API.'))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    memberService.show(id)
      .then(setMember)
      .catch((error) => notify.error('Não foi possível carregar o membro.', error.response?.data?.message || 'Verifique a API.'))
  }, [id, isEditing])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: uppercaseName(formData.get('name')?.trim() || ''),
      member_code: formData.get('member_code')?.trim(),
      delegation_id: formData.get('delegation_id') ? Number(formData.get('delegation_id')) : null,
      phone: formData.get('phone')?.trim() || null,
      email: formData.get('email')?.trim() || null,
      bi_number: formData.get('bi_number')?.trim() || null,
      status: member?.status ?? 'ACTIVE',
    }

    if (!payload.name || !payload.member_code || !payload.delegation_id || !payload.phone || !payload.bi_number) {
      notify.error('Campos obrigatórios.', 'Preencha todos os campos obrigatórios. Apenas o email é opcional.')
      return
    }

    if (!hasTwoWords(payload.name)) {
      notify.error('Nome incompleto.', 'Informe o nome completo do membro, com pelo menos duas palavras.')
      return
    }

    if (payload.phone && !/^(82|83|84|85|86|87)[0-9]{7}$/.test(payload.phone)) {
      notify.error('Telefone inválido.', 'Informe um número moçambicano válido com 9 dígitos, começando por 82, 83, 84, 85, 86 ou 87.')
      return
    }

    if (payload.bi_number && !/^[0-9]{11}[A-Z]$/.test(payload.bi_number)) {
      notify.error('BI inválido.', 'O BI deve ter 11 dígitos e uma letra maiúscula no fim.')
      return
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      notify.error('Email inválido.', 'Informe um email válido.')
      return
    }

    try {
      setSaving(true)
      if (isEditing) await memberService.update(id, payload)
      else await memberService.create(payload)
      notify.success(isEditing ? 'Dados do membro alterados.' : 'Membro registado com sucesso.')
      navigate('/membros')
    } catch (error) {
      notify.error('Membro não guardado.', getApiErrorMessage(error, payload))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de Membros</h1>
        <p>{isEditing ? 'Altere os dados do membro seleccionado.' : 'Registe os dados do membro e associe-o a sua delegação de origem.'}</p>
      </header>

      <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab" to="/membros">Visualizar</Link>
        <Link className="mode-tab active" to={isEditing ? `/membros/${id}/editar` : '/membros/novo'}>{isEditing ? 'Editar' : 'Registar'}</Link>
      </div>

      <form className="management-form-card" onSubmit={handleSubmit} key={member?.id ?? 'new-member'} noValidate>
        <div className="form-grid two-columns">
          <label className="form-field">
            <span>Nome</span>
            <input name="name" required defaultValue={member?.name ?? ''} onInput={(event) => { event.currentTarget.value = uppercaseName(event.currentTarget.value) }} />
          </label>
          <label className="form-field">
            <span>Código de membro</span>
            <input name="member_code" required defaultValue={member?.member_code ?? ''} />
          </label>
          <label className="form-field select-field">
            <span>Delegação de Origem</span>
            <select name="delegation_id" required value={member?.delegation_id ?? ''} onChange={(event) => setMember((current) => ({ ...(current ?? {}), delegation_id: event.target.value }))}>
              <option value="">Seleccione a delegação</option>
              {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Telefone</span>
            <input name="phone" required inputMode="numeric" placeholder="84XXXXXXX" defaultValue={member?.phone ?? ''} />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input name="email" type="email" defaultValue={member?.email ?? ''} />
          </label>
          <label className="form-field">
            <span>BI</span>
            <input name="bi_number" required placeholder="12345678901A" defaultValue={member?.bi_number ?? ''} />
          </label>
        </div>

        <div className="form-footer">
          <Link className="secondary-button" to="/membros">Cancelar</Link>
          <button className="primary-action-button" type="submit" disabled={saving}>{saving ? 'A guardar...' : isEditing ? 'Alterar dados' : 'Guardar registo'}</button>
        </div>
      </form>
    </section>
  )
}
