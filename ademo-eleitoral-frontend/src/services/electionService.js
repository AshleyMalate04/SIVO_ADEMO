import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const electionService = {
  async list(params = {}) {
    const response = await api.get('/elections', {
      params: {
        include: 'organ,position,delegation,creator,team.user,team.user.delegation',
        per_page: 100,
        ...params,
      },
    })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async show(id) {
    const response = await api.get(`/elections/${id}`, {
      params: { include: 'organ,position,delegation,creator,team.user,team.user.delegation' },
    })
    return unwrap(response)
  },

  async create(payload) {
    const response = await api.post('/elections', payload)
    return unwrap(response)
  },

  async update(id, payload) {
    const response = await api.put(`/elections/${id}`, payload)
    return unwrap(response)
  },

  async remove(id) {
    const response = await api.delete(`/elections/${id}`)
    return unwrap(response)
  },

  async saveTeam(id, users) {
    const response = await api.post(`/elections/${id}/team`, { users })
    return unwrap(response)
  },

  async updateTeamStatus(electionId, userId, status) {
    const response = await api.patch(`/elections/${electionId}/team/${userId}/status`, { status })
    return unwrap(response)
  },


  async updateStatus(id, status) {
    const response = await api.patch(`/elections/${id}/status`, { status })
    return unwrap(response)
  },

  async publishResults(id) {
    const response = await api.post(`/results/${id}/publish`)
    return unwrap(response)
  },

  async candidates(id) {
    const response = await api.get(`/elections/${id}/candidates`)
    return unwrap(response) ?? []
  },

  async physicalResults(id) {
    const response = await api.get(`/elections/${id}/physical-results`)
    return unwrap(response)
  },

  async savePhysicalResults(id, totals) {
    const response = await api.post(`/elections/${id}/physical-results`, { totals })
    return unwrap(response)
  },

  async approvePhysicalResults(id) {
    const response = await api.patch(`/elections/${id}/physical-results/approve`)
    return unwrap(response)
  },
}
