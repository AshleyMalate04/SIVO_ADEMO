import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const delegationService = {
  async list(params = {}) {
    const response = await api.get('/delegations', { params: { include: 'province,district', per_page: 100, ...params } })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async create(payload) {
    const response = await api.post('/delegations', payload)
    return unwrap(response)
  },

  async show(id) {
    const response = await api.get(`/delegations/${id}`, { params: { include: 'province,district' } })
    return unwrap(response)
  },

  async update(id, payload) {
    const response = await api.put(`/delegations/${id}`, payload)
    return unwrap(response)
  },

  async remove(id) {
    const response = await api.delete(`/delegations/${id}`)
    return unwrap(response)
  },

  async provinces() {
    const response = await api.get('/provinces', { params: { per_page: 100, sort_direction: 'asc' } })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async districts(provinceId) {
    if (!provinceId) return []
    const response = await api.get(`/provinces/${provinceId}/districts`)
    return unwrap(response) ?? []
  },
}
