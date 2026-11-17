import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Mail, MapPin, Phone, UserRound, X } from 'lucide-react'
import Loading from '../../components/common/Loading'
import { candidateService } from '../../services/candidateService'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { notify } from '../../utils/notify'
import { commonStatusClass } from '../../utils/statusFilters'

const statusLabel = (status) => ({
  APPROVED: 'Candidatura aprovada',
  SUSPENDED: 'Candidatura suspensa',
  REJECTED: 'Candidatura rejeitada',
}[status] ?? status)

export default function CandidateProfilePage() {
  const { eleicaoId, candidateId } = useParams()
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState(null)
  const [showPhoto, setShowPhoto] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    if (!candidateId) return
    setLoading(true)
    candidateService.show(candidateId)
      .then(setCandidate)
      .catch((error) => notify.error('Não foi possível carregar candidato.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [candidateId])

  const backTo = useMemo(() => (eleicaoId ? `/portal-eleitor/votacoes/${eleicaoId}` : '/candidatos'), [eleicaoId])
  const photoUrl = resolveAssetUrl(candidate?.photo_url || candidate?.photo_path)
  const visiblePhotoUrl = photoFailed ? '' : photoUrl
  const documentUrl = resolveAssetUrl(candidate?.document_url)
  const hasDocument = Boolean(documentUrl)

  useEffect(() => {
    setPhotoFailed(false)
  }, [photoUrl])

  const openDocument = async () => {
    if (!hasDocument) {
      notify.success('Documento indisponível.', 'Este candidato não tem documento associado.')
      return
    }

    const tab = window.open('', '_blank')
    if (!tab) {
      notify.error('Não foi possível abrir o documento.', 'Permita novas janelas e tente novamente.')
      return
    }
    tab.opener = null

    try {
      const freshCandidate = await candidateService.show(candidateId)
      const freshUrl = resolveAssetUrl(freshCandidate?.document_url)
      if (!freshUrl) throw new Error('Documento indisponível')
      tab.location.replace(freshUrl)
    } catch {
      tab.close()
      notify.error('Documento indisponível.', 'Actualize a página ou tente novamente mais tarde.')
    }
  }

  if (loading) return <Loading label="A carregar dados do candidato..." />
  if (!candidate) return null

  return (
    <section className="voter-page candidate-detail-page readable-detail-page">
      <div className="candidate-detail-header">
        <div>
          <Link className="back-link" to={backTo}><ArrowLeft size={18} /> Voltar</Link>
          <header className="management-header">
            <h1>Detalhes do candidato</h1>
            <p>Consulte os dados reais do candidato.</p>
          </header>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button" onClick={openDocument} disabled={!hasDocument} title={hasDocument ? 'Abrir documento do candidato' : 'Sem documento associado'}>
            <FileText size={18} /> {hasDocument ? 'Ver documento' : 'Sem documento'}
          </button>
        </div>
      </div>

      <section className="candidate-detail-grid">
        <aside className="candidate-profile-card">
          <button className="candidate-avatar candidate-avatar-button" type="button" onClick={() => visiblePhotoUrl && setShowPhoto(true)} disabled={!visiblePhotoUrl} title={visiblePhotoUrl ? 'Ver fotografia em tamanho maior' : 'Sem fotografia'}>
            {visiblePhotoUrl ? (
              <img
                src={visiblePhotoUrl}
                alt={`Fotografia de ${candidate.member?.name ?? 'candidato'}`}
                onError={() => {
                  setPhotoFailed(true)
                  setShowPhoto(false)
                }}
              />
            ) : <UserRound size={82} />}
          </button>
          <h2>{candidate.member?.name ?? 'Sem nome'}</h2>
          <p>{candidate.member?.delegation?.name ?? 'Sem delegação'}</p>
          <span className={`status-pill ${commonStatusClass(candidate.status)}`}>{statusLabel(candidate.status)}</span>
        </aside>

        <article className="candidate-data-card">
          <h2>Informações da candidatura</h2>
          <div className="candidate-data-grid">
            <label><span>Eleição</span><p>{candidate.election?.title ?? 'Sem eleição'}</p></label>
            <label><span>Órgão</span><p>{candidate.election?.organ?.name ?? 'Sem órgão'}</p></label>
            <label><span>Cargo</span><p>{candidate.position?.name ?? 'Sem cargo'}</p></label>
            <label><span>Delegação</span><p><MapPin size={15} /> {candidate.member?.delegation?.name ?? 'Sem delegação'}</p></label>
            <label><span>Email</span><p><Mail size={15} /> {candidate.member?.email ?? 'Sem email'}</p></label>
            <label><span>Contacto</span><p><Phone size={15} /> {candidate.member?.phone ?? 'Sem contacto'}</p></label>
            <label className="full"><span>Biografia</span><p>{candidate.biography || 'Sem biografia registada.'}</p></label>
            <label className="full"><span>Proposta principal</span><p>{candidate.proposal || 'Sem proposta registada.'}</p></label>
          </div>
        </article>
      </section>

      {showPhoto && visiblePhotoUrl ? (
        <div className="image-preview-backdrop" role="dialog" aria-modal="true" onClick={() => setShowPhoto(false)}>
          <button className="image-preview-close" type="button" onClick={() => setShowPhoto(false)} aria-label="Fechar imagem"><X size={22} /></button>
          <img
            src={visiblePhotoUrl}
            alt={`Fotografia de ${candidate.member?.name ?? 'candidato'}`}
            onClick={(event) => event.stopPropagation()}
            onError={() => {
              setPhotoFailed(true)
              setShowPhoto(false)
            }}
          />
        </div>
      ) : null}
    </section>
  )
}
