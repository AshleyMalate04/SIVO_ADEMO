import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const userService = {
  async list(params = {}) {
    const response = await api.get('/users', { params: { include: 'delegation', per_page: 100, ...params } })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async show(id) {
    const response = await api.get(`/users/${id}`, { params: { include: 'delegation' } })
    return unwrap(response)
  },

  async create(payload) {
    const response = await api.post('/users', payload)
    return unwrap(response)
  },

  async update(id, payload) {
    const response = await api.put(`/users/${id}`, payload)
    return unwrap(response)
  },

  async updateStatus(id, payload) {
    const response = await api.patch(`/users/${id}/status`, payload)
    return unwrap(response)
  },

  async remove(id) {
    const response = await api.delete(`/users/${id}`)
    return unwrap(response)
  },
}
