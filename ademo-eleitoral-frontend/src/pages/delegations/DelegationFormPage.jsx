import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { notify } from '../../utils/notify'
import { delegationService } from '../../services/delegationService'
import { onlyActive } from '../../utils/statusFilters'

export default function DelegationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [provinceId, setProvinceId] = useState('')
  const [delegation, setDelegation] = useState(null)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    delegationService.provinces()
      .then((records) => setProvinces(onlyActive(records)))
      .catch((error) => notify.error('Não foi possível carregar províncias.', error.response?.data?.message || 'Verifique a API.'))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    delegationService.show(id)
      .then((record) => {
        setDelegation(record)
        setProvinceId(String(record.province_id ?? ''))
      })
      .catch((error) => notify.error('Não foi possível carregar a delegação.', error.response?.data?.message || 'Verifique a API.'))
  }, [id, isEditing])

  useEffect(() => {
    if (!provinceId) {
      setDistricts([])
      return
    }

    setLoadingDistricts(true)
    delegationService.districts(provinceId)
      .then((records) => setDistricts(onlyActive(records)))
      .catch((error) => notify.error('Não foi possível carregar distritos.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoadingDistricts(false))
  }, [provinceId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const payload = {
      name: formData.get('name')?.trim(),
      province_id: Number(formData.get('province_id')),
      district_id: formData.get('district_id') ? Number(formData.get('district_id')) : null,
      address: formData.get('address')?.trim(),
      status: 'ACTIVE',
    }

    if (!payload.name || !payload.province_id || !payload.district_id || !payload.address) {
      notify.error('Campos obrigatórios.', 'Preencha nome, província, distrito e endereço.')
      return
    }

    try {
      setSaving(true)
      if (isEditing) await delegationService.update(id, payload)
      else await delegationService.create(payload)
      notify.success(isEditing ? 'Dados da delegação alterados.' : 'Delegação registada com sucesso.')
      navigate('/delegacoes')
    } catch (error) {
      notify.error('Delegação não registada.', error.response?.data?.message || 'Verifique os campos informados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de Delegações</h1>
        <p>{isEditing ? 'Altere os dados da delegação seleccionada.' : 'Registe a delegação e associe-a à província e distrito carregados da base de dados.'}</p>
      </header>

      <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab" to="/delegacoes">Visualizar</Link>
        <Link className="mode-tab active" to={isEditing ? `/delegacoes/${id}/editar` : '/delegacoes/nova'}>{isEditing ? 'Editar' : 'Registar'}</Link>
      </div>

      <form className="management-form-card" onSubmit={handleSubmit} key={delegation?.id ?? 'new-delegation'}>
        <div className="form-grid two-columns">
          <label className="form-field">
            <span>Nome</span>
            <input name="name" required placeholder="Nome da delegação" defaultValue={delegation?.name ?? ''} />
          </label>
          <label className="form-field select-field">
            <span>Província</span>
            <select name="province_id" required value={provinceId} onChange={(event) => setProvinceId(event.target.value)}>
              <option value="" disabled>Seleccione a província</option>
              {provinces.map((province) => <option key={province.id} value={province.id}>{province.name}</option>)}
            </select>
          </label>
          <label className="form-field select-field">
            <span>Distrito</span>
            <select name="district_id" required disabled={!provinceId || loadingDistricts} value={delegation?.district_id ?? ''} onChange={(event) => setDelegation((current) => ({ ...(current ?? {}), district_id: event.target.value }))}>
              <option value="" disabled>{provinceId ? 'Seleccione o distrito' : 'Seleccione primeiro a província'}</option>
              {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Endereço</span>
            <input name="address" required placeholder="Endereço da delegação" defaultValue={delegation?.address ?? ''} />
          </label>
        </div>

        <div className="form-divider"></div>

        <div className="form-footer">
          <Link className="secondary-button" to="/delegacoes">Cancelar</Link>
          <button className="primary-action-button" type="submit" disabled={saving}>{saving ? 'A guardar...' : isEditing ? 'Alterar dados' : 'Guardar'}</button>
        </div>
      </form>
    </section>
  )
}
