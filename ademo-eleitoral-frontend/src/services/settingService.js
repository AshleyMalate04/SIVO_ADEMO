import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const settingService = {
  async updatePassword(payload) {
    const response = await api.put('/settings/password', payload)
    return unwrap(response)
  },
}
