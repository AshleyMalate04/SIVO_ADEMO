import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const voterService = {
  async byElection(electionId) {
    if (!electionId) return []
    const response = await api.get(`/elections/${electionId}/voters`)
    return unwrap(response) ?? []
  },

  async addToElection(electionId, payload) {
    const response = await api.post(`/elections/${electionId}/voters`, payload)
    return unwrap(response)
  },

  async removeFromElection(electionId, memberId) {
    const response = await api.delete(`/elections/${electionId}/voters/${memberId}`)
    return unwrap(response)
  },

  async updateStatus(electionId, memberId, status) {
    const response = await api.patch(`/elections/${electionId}/voters/${memberId}/status`, { status })
    return unwrap(response)
  },
}
