import api from './api'

export const transferService = {
  async initiate(payload) {
    // payload: { landId, recipientNationalId, reason }
    const { data } = await api.post('/transfers', payload)
    return data
  },

  async getAll(params = {}) {
    const { data } = await api.get('/transfers', { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`/transfers/${id}`)
    return data
  },

  async approve(id, comment = '') {
    const { data } = await api.post(`/transfers/${id}/approve`, { comment })
    return data
  },

  async reject(id, reason) {
    const { data } = await api.post(`/transfers/${id}/reject`, { reason })
    return data
  },

  async getPending() {
    const { data } = await api.get('/transfers', { params: { status: 'pending' } })
    return data
  },
}

export const blockchainService = {
  async verify(txHash) {
    const { data } = await api.get(`/blockchain/verify/${txHash}`)
    return data
  },

  async getLandRecord(landId) {
    const { data } = await api.get(`/blockchain/land/${landId}`)
    return data
  },
}

export const adminService = {
  async getUsers(params = {}) {
    const { data } = await api.get('/admin/users', { params })
    return data
  },

  async updateUserRole(userId, role) {
    const { data } = await api.patch(`/admin/users/${userId}/role`, { role })
    return data
  },

  async toggleUserStatus(userId, active) {
    const { data } = await api.patch(`/admin/users/${userId}/status`, { active })
    return data
  },

  async getDashboardStats() {
    const { data } = await api.get('/admin/stats')
    return data
  },
}