import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const voteService = {
  async elections() {
    const response = await api.get('/voting/elections')
    return unwrap(response) ?? []
  },

  async ballot(id) {
    const response = await api.get(`/voting/elections/${id}/ballot`)
    return unwrap(response)
  },

  async confirm(id, payload) {
    const response = await api.post(`/voting/elections/${id}/confirm`, payload)
    return unwrap(response)
  },
}
