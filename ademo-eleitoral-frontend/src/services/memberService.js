import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const memberService = {
  async list(params = {}) {
    const response = await api.get('/members', { params: { include: 'delegation,registrar', per_page: 100, ...params } })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async show(id) {
    const response = await api.get(`/members/${id}`, { params: { include: 'delegation,registrar' } })
    return unwrap(response)
  },

  async create(payload) {
    const response = await api.post('/members', payload)
    return unwrap(response)
  },

  async update(id, payload) {
    const response = await api.put(`/members/${id}`, payload)
    return unwrap(response)
  },

  async remove(id) {
    const response = await api.delete(`/members/${id}`)
    return unwrap(response)
  },
}
