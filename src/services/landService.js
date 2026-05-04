import api from './api'

export const landService = {
  async getAll(params = {}) {
    // params: { page, limit, search, status, ownerId }
    const { data } = await api.get('/lands', { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`/lands/${id}`)
    return data
  },

  async register(payload) {
    // payload: { plotNumber, location, area, coordinates, titleDeedNumber, ownerNationalId }
    const { data } = await api.post('/lands', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.patch(`/lands/${id}`, payload)
    return data
  },

  async getHistory(id) {
    const { data } = await api.get(`/lands/${id}/history`)
    return data
  },

  async search(query) {
    const { data } = await api.get('/lands/search', { params: { q: query } })
    return data
  },
}