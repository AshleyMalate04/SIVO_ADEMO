import { api } from '../lib/api'

const unwrap = (response) => response.data?.data
const listFromPayload = (payload) => payload?.data ?? payload ?? []

export const notificationService = {
  async list(params = {}) {
    const response = await api.get('/notifications', { params: { per_page: 100, ...params } })
    return listFromPayload(unwrap(response))
  },

  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`)
    return unwrap(response)
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all')
    return unwrap(response)
  },

  async remove(id) {
    const response = await api.delete(`/notifications/${id}`)
    return unwrap(response)
  },
}
