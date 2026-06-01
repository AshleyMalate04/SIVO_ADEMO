// import { api } from '../lib/api'

// const unwrap = (response) => response.data?.data

// export const candidateService = {
//   async byElection(electionId) {
//     if (!electionId) return []
//     const response = await api.get(`/elections/${electionId}/candidates`)
//     return unwrap(response) ?? []
//   },

//   async createForElection(electionId, payload) {
//     const response = await api.post(`/elections/${electionId}/candidates`, payload, payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
//     return unwrap(response)
//   },

//   async list(params = {}) {
//   const response = await api.get('/candidates', {
//     params: {
//       per_page: 100,
//       ...params,
//     },
//   })

//   const payload = unwrap(response)
//   return payload?.data ?? payload ?? []
// },

//   async show(id) {
//     const response = await api.get(`/candidates/${id}`)
//     return unwrap(response)
//   },

//   async update(id, payload) {
//     if (payload instanceof FormData) {
//       payload.append('_method', 'PUT')
//       const response = await api.post(`/candidates/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
//       return unwrap(response)
//     }
//     const response = await api.put(`/candidates/${id}`, payload)
//     return unwrap(response)
//   },

//   async updateStatus(id, payload) {
//     const response = await api.patch(`/candidates/${id}/status`, payload)
//     return unwrap(response)
//   },
// }


import { api } from '../lib/api'

const unwrap = (response) => response.data?.data

export const candidateService = {
  async list(params = {}) {
    const response = await api.get('/candidates', {
      params: {
        per_page: 100,
        ...params,
      },
    })

    const payload = unwrap(response)
    return payload?.data ?? payload ?? []
  },

  async byElection(electionId) {
    if (!electionId) return []
    const response = await api.get(`/elections/${electionId}/candidates`)
    return unwrap(response) ?? []
  },

  async createForElection(electionId, payload) {
    const response = await api.post(
      `/elections/${electionId}/candidates`,
      payload,
      payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    )
    return unwrap(response)
  },

  async show(id) {
    const response = await api.get(`/candidates/${id}`)
    return unwrap(response)
  },

  async update(id, payload) {
    if (payload instanceof FormData) {
      payload.append('_method', 'PUT')
      const response = await api.post(`/candidates/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return unwrap(response)
    }

    const response = await api.put(`/candidates/${id}`, payload)
    return unwrap(response)
  },

  async updateStatus(id, payload) {
    const response = await api.patch(`/candidates/${id}/status`, payload)
    return unwrap(response)
  },
}