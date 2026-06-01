import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileText, Image, Upload } from 'lucide-react'
import Loading from '../../components/common/Loading'
import { candidateService } from '../../services/candidateService'
import { electionService } from '../../services/electionService'
import { memberService } from '../../services/memberService'
import { getApiErrorMessage } from '../../utils/apiError'
import { notify } from '../../utils/notify'
import { normalizeId } from '../../utils/statusFilters'

export default function ElectionCandidateFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const photoInputRef = useRef(null)
  const documentInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [elections, setElections] = useState([])
  const [members, setMembers] = useState([])
  const [photoName, setPhotoName] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [documentFile, setDocumentFile] = useState(null)
  const [form, setForm] = useState({ election_id: '', member_id: '', biography: '', proposal: '' })

  useEffect(() => {
    Promise.all([
      electionService.list(),
      memberService.list(),
      isEditing ? candidateService.show(id) : Promise.resolve(null),
    ])
      .then(([electionRecords, memberRecords, candidate]) => {
        const programmadas = electionRecords.filter((election) => election.status === 'PROGRAMADA' || (candidate && String(election.id) === String(candidate.election_id)))
        setElections(programmadas)
        setMembers(memberRecords.filter((member) => member.status === 'ACTIVE' || (candidate && String(member.id) === String(candidate.member_id))))

        if (candidate) {
          setForm({
            election_id: normalizeId(candidate.election_id),
            member_id: normalizeId(candidate.member_id),
            biography: candidate.biography ?? '',
            proposal: candidate.proposal ?? '',
          })
          setPhotoName(candidate.photo_path ?? '')
          setDocumentName(candidate.document_path ?? '')
          if (candidate.photo_url || candidate.photo_path) setPhotoPreview(candidate.photo_url || candidate.photo_path)
        } else {
          setForm((current) => ({ ...current, election_id: programmadas[0]?.id ? String(programmadas[0].id) : '' }))
        }
      })
      .catch((error) => notify.error('Não foi possível carregar dados.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  const selectedElection = useMemo(() => elections.find((election) => String(election.id) === String(form.election_id)), [elections, form.election_id])
  const selectedMember = useMemo(() => members.find((member) => String(member.id) === String(form.member_id)), [members, form.member_id])

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setPhotoFile(file)
    setPhotoName(file?.name || '')
    setPhotoPreview(file ? URL.createObjectURL(file) : '')
  }

  const handleDocumentChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setDocumentFile(file)
    setDocumentName(file?.name || '')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedElection) return notify.error('Seleccione a eleição.')
    if (!form.member_id) return notify.error('Seleccione o membro que será promovido a candidato.')

    const payload = new FormData()
    payload.append('member_id', Number(form.member_id))
    payload.append('position_id', selectedElection.position_id)
    payload.append('biography', form.biography || '')
    payload.append('proposal', form.proposal || '')
    payload.append('status', 'APPROVED')

    if (photoFile) payload.append('photo_file', photoFile)
    else if (photoName) payload.append('photo_path', photoName)

    if (documentFile) payload.append('document_file', documentFile)
    else if (documentName) payload.append('document_path', documentName)

    try {
      setSaving(true)
      if (isEditing) await candidateService.update(id, payload)
      else await candidateService.createForElection(selectedElection.id, payload)
      notify.success(isEditing ? 'Dados do candidato alterados.' : 'Candidato registado com sucesso.')
      navigate('/candidatos')
    } catch (error) {
      notify.error('Candidato não guardado.', getApiErrorMessage(error, payload))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="A carregar dados do candidato..." />

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão do Candidato</h1>
        <p>Registe e altere candidatos com dados completos antes do início da eleição.</p>
      </header>

      <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab" to="/candidatos">Visualizar</Link>
        <Link className="mode-tab active" to={isEditing ? `/candidatos/${id}/editar` : '/candidatos/novo'}>{isEditing ? 'Editar' : 'Registar'}</Link>
      </div>

      <form className="management-form-card candidate-form-card" onSubmit={handleSubmit} noValidate>
        <h2>{isEditing ? 'Editar candidato' : 'Novo candidato'}</h2>
        <div className="form-grid two-columns">
          <label className="form-field select-field">
            <span>Nome da Eleição</span>
            <select value={form.election_id} onChange={(event) => setField('election_id', event.target.value)} disabled={isEditing}>
              <option value="">Seleccione a eleição</option>
              {elections.map((election) => <option key={election.id} value={election.id}>{`${election.title} (${election.status})`}</option>)}
            </select>
          </label>
          <label className="form-field select-field">
            <span>Promover Membro</span>
            <select value={form.member_id} onChange={(event) => setField('member_id', event.target.value)} disabled={isEditing}>
              <option value="">Seleccione o membro aprovado</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>
          <label className="form-field"><span>Delegação de Origem</span><input readOnly value={selectedMember?.delegation?.name ?? ''} /></label>
          <label className="form-field"><span>Órgão</span><input readOnly value={selectedElection?.organ?.name ?? ''} /></label>
          <label className="form-field"><span>Cargo</span><input readOnly value={selectedElection?.position?.name ?? ''} /></label>
        </div>

        <div className="upload-grid">
          <section className="upload-card">
            <span>Foto (Opcional)</span>
            <div className="upload-dropzone">
              {photoPreview ? <img className="upload-preview" src={photoPreview} alt="Pré-visualização da fotografia" /> : <Image size={30} />}
              <p>{photoName || 'Upload da foto'}</p>
              <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              <button className="secondary-button" type="button" onClick={() => photoInputRef.current?.click()}><Upload size={18} /> Seleccionar</button>
            </div>
          </section>
          <section className="upload-card">
            <span>Documento (Opcional)</span>
            <div className="upload-dropzone">
              <FileText size={30} />
              <p>{documentName || 'Nome do documento'}</p>
              <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" hidden onChange={handleDocumentChange} />
              <button className="secondary-button" type="button" onClick={() => documentInputRef.current?.click()}><Upload size={18} /> Seleccionar</button>
            </div>
          </section>
        </div>

        <div className="form-grid two-columns">
          <label className="form-field"><span>Biografia</span><textarea value={form.biography} onChange={(event) => setField('biography', event.target.value)} /></label>
          <label className="form-field"><span>Proposta</span><textarea value={form.proposal} onChange={(event) => setField('proposal', event.target.value)} /></label>
        </div>

        <div className="form-divider"></div>
        <div className="form-footer">
          <Link className="secondary-button" to="/candidatos">Cancelar</Link>
          <button className="primary-action-button" type="submit" disabled={saving}>{saving ? 'A guardar...' : isEditing ? 'Alterar dados' : 'Guardar'}</button>
        </div>
      </form>
    </section>
  )
}
