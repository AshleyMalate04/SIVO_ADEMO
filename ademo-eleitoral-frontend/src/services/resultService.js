import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const resultService = {
  async list(params = {}) {
    const response = await api.get('/results', { params: { include: 'organ,position,delegation', per_page: 100, ...params } })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async show(electionId) {
    if (!electionId) return null
    const response = await api.get(`/results/${electionId}`)
    return unwrap(response)
  },

  async publish(electionId, payload = {}) {
    const response = await api.post(`/results/${electionId}/publish`, payload)
    return unwrap(response)
  },
}
