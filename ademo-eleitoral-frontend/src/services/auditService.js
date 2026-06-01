import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const auditService = {
  async list(params = {}) {
    const response = await api.get('/audit', { params: { per_page: 1000, ...params } })
    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },
}
