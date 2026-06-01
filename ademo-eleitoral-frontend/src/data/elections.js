export const ELECTION_STATUS_LABELS = {
  PROGRAMADA: 'Programada',
  EM_VOTACAO: 'Em votação',
  CONCLUIDA: 'Concluída',
  RESULTADOS_PUBLICADOS: 'Resultados publicados',
}

export const ELECTION_STATUS_CLASS = {
  PROGRAMADA: 'scheduled',
  EM_VOTACAO: 'voting',
  CONCLUIDA: 'completed',
  RESULTADOS_PUBLICADOS: 'published',
}

export const selectableElections = [
  {
    id: 1,
    title: 'Eleição para Presidente da Mesa da Assembleia 2026',
    organ: 'Mesa da Assembleia',
    role: 'Presidente',
    delegation: 'Maputo',
    status: 'PROGRAMADA',
    participation: '75%',
  },
  {
    id: 2,
    title: 'Eleição para Vice-presidente do Conselho Fiscal 2026',
    organ: 'Conselho Fiscal',
    role: 'Vice-Presidente',
    delegation: 'Gaza',
    status: 'RESULTADOS_PUBLICADOS',
    participation: '100%',
  },
  {
    id: 3,
    title: 'Eleição para Secretariado Executivo 2026',
    organ: 'Secretariado Executivo',
    role: 'Secretário',
    delegation: 'Nampula',
    status: 'EM_VOTACAO',
    participation: '42%',
  },
  {
    id: 4,
    title: 'Eleição para Conselho Jurisdicional 2026',
    organ: 'Conselho Jurisdicional',
    role: 'Presidente',
    delegation: 'Sofala',
    status: 'CONCLUIDA',
    participation: '88%',
  },
  {
    id: 5,
    title: 'Eleição para Comissão de Ética 2026',
    organ: 'Comissão de Ética',
    role: 'Coordenador',
    delegation: 'Tete',
    status: 'PROGRAMADA',
    participation: '0%',
  },
  {
    id: 6,
    title: 'Eleição para Direcção Provincial 2026',
    organ: 'Direcção Provincial',
    role: 'Coordenador',
    delegation: 'Manica',
    status: 'EM_VOTACAO',
    participation: '12%',
  },
  {
    id: 7,
    title: 'Eleição para Assembleia Provincial 2026',
    organ: 'Assembleia Provincial',
    role: 'Presidente',
    delegation: 'Zambézia',
    status: 'PROGRAMADA',
    participation: '0%',
  },
  {
    id: 8,
    title: 'Eleição para Delegação Niassa 2026',
    organ: 'Direcção Provincial',
    role: 'Secretário',
    delegation: 'Niassa',
    status: 'CONCLUIDA',
    participation: '93%',
  },
]

export function getElectionStatusLabel(status) {
  return ELECTION_STATUS_LABELS[status] ?? status
}

export function getElectionStatusClass(status) {
  return ELECTION_STATUS_CLASS[status] ?? 'scheduled'
}

export const getElectionById = (id) =>
  selectableElections.find((election) => String(election.id) === String(id)) ?? selectableElections[0]
