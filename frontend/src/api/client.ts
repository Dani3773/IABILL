import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Interceptor: adiciona o token JWT automaticamente em toda requisição,
// se ele existir no momento da chamada.
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})