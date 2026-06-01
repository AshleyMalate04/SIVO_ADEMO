export default function CandidateCard({ candidate }) {
  return <article>{candidate?.name ?? 'Candidato'}</article>
}
