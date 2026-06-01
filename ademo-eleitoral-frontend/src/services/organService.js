import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const organService = {
  async list(params = {}) {
    const response = await api.get('/organs', { params: { include: 'positions', per_page: 100, ...params } })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async create(payload) {
    const response = await api.post('/organs', payload)
    return unwrap(response)
  },

  async show(id) {
    const response = await api.get(`/organs/${id}`, { params: { include: 'positions' } })
    return unwrap(response)
  },

  async update(id, payload) {
    const response = await api.put(`/organs/${id}`, payload)
    return unwrap(response)
  },

  async remove(id) {
    const response = await api.delete(`/organs/${id}`)
    return unwrap(response)
  },

  async addPosition(organId, payload) {
    const response = await api.post(`/organs/${organId}/positions`, {
      ...payload,
      organ_id: organId,
    })
    return unwrap(response)
  },

  async updatePosition(positionId, payload) {
    const response = await api.put(`/positions/${positionId}`, payload)
    return unwrap(response)
  },

  async removePosition(positionId) {
    const response = await api.delete(`/positions/${positionId}`)
    return unwrap(response)
  },

  async positions(organId) {
    if (!organId) return []
    const response = await api.get(`/organs/${organId}/positions`)
    return unwrap(response) ?? []
  },
}
