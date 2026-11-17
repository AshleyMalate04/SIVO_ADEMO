import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import DateTimePicker from '../../components/common/DateTimePicker'
import Loading from '../../components/common/Loading'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { organService } from '../../services/organService'
import { getApiErrorMessage } from '../../utils/apiError'
import { notify } from '../../utils/notify'
//import { getTodayMinDateTime, isBeforeToday, isSameOrBefore, toApiDateTime, toInputDateTime } from '../../utils/localDateTime'

import { getCurrentMinDateTime, isBeforeNow, isSameOrBefore, toApiDateTime, toInputDateTime } from '../../utils/localDateTime'
import { normalizeId, onlyActive } from '../../utils/statusFilters'

function WizardSteps({ stepOneReady }) {
  return (
    <div className="wizard-steps" aria-label="Etapas de criação da eleição">
      <div className="wizard-step active">
        <strong>1</strong>
        <span><small>ETAPA</small>Dados da eleição</span>
      </div>
      <button
        className="wizard-step wizard-step-disabled"
        type="button"
        aria-disabled={!stepOneReady}
        disabled={!stepOneReady}
        title="Preencha e valide a etapa 1 para continuar"
      >
        <strong>2</strong>
        <span><small>ETAPA</small>Equipa autorizada</span>
      </button>
    </div>
  )
}

export default function ElectionCreatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const minDateTime = getCurrentMinDateTime()
  const [delegations, setDelegations] = useState([])
  const [organs, setOrgans] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    delegation_id: '',
    organ_id: '',
    position_id: '',
    starts_at: '',
    ends_at: '',
    description: '',
    allow_blank_vote: true,
  })

  useEffect(() => {
    Promise.all([
      delegationService.list(),
      organService.list(),
      isEditing ? electionService.show(id) : Promise.resolve(null),
    ])
      .then(([delegationRecords, organRecords, election]) => {
        const activeDelegations = onlyActive(delegationRecords)
        const activeOrgans = onlyActive(organRecords)

        setDelegations(activeDelegations)
        setOrgans(activeOrgans)
        if (election) {
          setForm({
            title: election.title ?? '',
            delegation_id: normalizeId(election.delegation_id),
            organ_id: normalizeId(election.organ_id),
            position_id: normalizeId(election.position_id),
            starts_at: toInputDateTime(election.starts_at),
            ends_at: toInputDateTime(election.ends_at),
            description: election.description ?? '',
            allow_blank_vote: Boolean(election.allow_blank_vote ?? true),
          })
        }
      })
      .catch((error) => notify.error('Não foi possível carregar dados da eleição.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  useEffect(() => {
    if (!form.organ_id) {
      setPositions([])
      return
    }

    organService.positions(form.organ_id)
      .then((records) => setPositions(onlyActive(records)))
      .catch((error) => notify.error('Não foi possível carregar cargos.', error.response?.data?.message || 'Verifique a API.'))
  }, [form.organ_id])

  const stepOneReady = useMemo(() => (
    form.title &&
    form.delegation_id &&
    form.organ_id &&
    form.position_id &&
    form.starts_at &&
    form.ends_at &&
    form.description
  ), [form])

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'organ_id' ? { position_id: '' } : {}),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title || !form.delegation_id || !form.organ_id || !form.position_id || !form.starts_at || !form.ends_at || !form.description) {
      notify.error('Campos obrigatórios.', 'Preencha todos os campos obrigatórios antes de guardar a eleição.')
      return
    }

    // if (isBeforeToday(form.starts_at)) {
    //   notify.error('Data de início inválida.', 'A votação não pode iniciar num dia anterior ao actual.')
    //   return
    // }

    if (isBeforeNow(form.starts_at)) {
  notify.error(
    'Data de início inválida.',
    'O início da votação não pode ser inferior à data e hora actual.'
  )
  return
}

    if (isSameOrBefore(form.ends_at, form.starts_at)) {
      notify.error('Data de fim inválida.', 'O fim da votação deve ser posterior ao início.')
      return
    }

    const payload = {
      title: form.title,
      organ_id: Number(form.organ_id),
      position_id: Number(form.position_id),
      delegation_id: Number(form.delegation_id),
      starts_at: toApiDateTime(form.starts_at),
      ends_at: toApiDateTime(form.ends_at),
      description: form.description,
      allow_blank_vote: form.allow_blank_vote,
      status: 'PROGRAMADA',
    }

    try {
      setSaving(true)
      const savedElection = isEditing ? await electionService.update(id, payload) : await electionService.create(payload)
      notify.success(isEditing ? 'Eleição actualizada.' : 'Eleição criada com sucesso.')
      navigate(isEditing ? '/eleicoes' : `/eleicoes/${savedElection.id}/equipa`)
    } catch (error) {
      notify.error('Eleição não guardada.', getApiErrorMessage(error, payload))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading label="A carregar dados da eleição..." />
  }

  return (
    <section className="management-page election-create-page">
      <header className="management-header">
        <h1>{isEditing ? 'Editar eleição' : 'Etapa 1 - Dados da Eleição'}</h1>
        <p>{isEditing ? 'Actualize os dados registados antes de guardar as alteracoes.' : 'Preencha os dados principais, o periodo de votação e a estrutura da eleição.'}</p>
      </header>

      {!isEditing ? <WizardSteps stepOneReady={Boolean(stepOneReady)} /> : null}

      <form className="management-form-card election-form-card" onSubmit={handleSubmit} noValidate>
        <h2>Dados da eleição</h2>
        <div className="form-grid two-columns">
          <label className="form-field">
            <span>Título</span>
            <input
              required
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="Título da eleição"
            />
          </label>
          <label className="form-field select-field">
            <span>Delegação</span>
            <select required value={form.delegation_id} onChange={(event) => setField('delegation_id', event.target.value)}>
              <option value="" disabled>Seleccione a delegação</option>
              {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
            </select>
          </label>
          <label className="form-field select-field">
            <span>Órgão</span>
            <select required value={form.organ_id} onChange={(event) => setField('organ_id', event.target.value)}>
              <option value="" disabled>Seleccione o órgão</option>
              {organs.map((organ) => <option key={organ.id} value={organ.id}>{organ.name}</option>)}
            </select>
          </label>
          <label className="form-field select-field">
            <span>Cargo</span>
            <select required value={form.position_id} onChange={(event) => setField('position_id', event.target.value)} disabled={!form.organ_id}>
              <option value="" disabled>{form.organ_id ? 'Seleccione o cargo' : 'Seleccione primeiro o órgão'}</option>
              {positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
            </select>
          </label>
          <div className="form-field">
            <span>Início da votação</span>
            <DateTimePicker
              min={minDateTime}
              value={form.starts_at}
              onChange={(nextValue) => setField('starts_at', nextValue)}
              ariaLabel="Seleccionar início da votação"
              placeholder="Seleccionar início..."
            />
          </div>
          <div className="form-field">
            <span>Fim da votação</span>
            <DateTimePicker
              min={form.starts_at || minDateTime}
              value={form.ends_at}
              onChange={(nextValue) => setField('ends_at', nextValue)}
              ariaLabel="Seleccionar fim da votação"
              placeholder="Seleccionar fim..."
            />
          </div>
        </div>

        <label className="form-field">
          <span>Descrição</span>
          <textarea
            required
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="Descreva o objectivo e o enquadramento da eleição."
          />
        </label>

        <div className="form-footer">
          <Link className="secondary-button" to="/eleicoes">Cancelar</Link>
          <button className="primary-action-button" type="submit" disabled={saving}>
            {saving ? 'A guardar...' : isEditing ? 'Alterar dados' : 'Criar eleição'}
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
    </section>
  )
}
