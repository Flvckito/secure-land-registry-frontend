import api from './api'

export const authService = {
  /**
   * Login user. Returns { token, user: { id, name, email, role } }
   * Adjust field names to match your actual backend response.
   */
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  async register(payload) {
    // payload: { name, email, password, nationalId, phone }
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Best-effort — always clear local session
    }
  },

  async getProfile() {
    const { data } = await api.get('/auth/me')
    return data
  },
}