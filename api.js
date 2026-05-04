/**
 * api.js — Centralized Axios instance
 *
 * Token strategy: JWT stored in memory (AuthContext) and written to sessionStorage
 * as a fallback for page refreshes. Never localStorage — reduces XSS surface.
 * The interceptor attaches the token from sessionStorage so it survives refresh
 * without requiring a re-login.
 *
 * For production: move to httpOnly cookies and drop sessionStorage entirely.
 * That requires a backend config change (Set-Cookie header).
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token on every request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('lr_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      // Token expired or invalid — clear session and redirect
      sessionStorage.removeItem('lr_token')
      window.location.href = '/login?reason=session_expired'
    }

    if (status === 403) {
      // Authenticated but not authorized — let components handle this
      error.message = 'You do not have permission to perform this action.'
    }

    if (!error.response) {
      error.message = 'Network error. Please check your connection.'
    }

    return Promise.reject(error)
  }
)

export default api