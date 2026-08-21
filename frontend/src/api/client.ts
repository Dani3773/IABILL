import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Intercepta globalmente a resposta especifica de tenant desativado, sem
// precisar tratar isso em cada chamada individual - redireciona direto para
// a pagina dedicada, distinguindo de um 401 comum de sessao expirada.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error === 'TENANT_SUSPENDED') {
      if (window.location.pathname !== '/conta-suspensa') {
        window.location.href = '/conta-suspensa'
      }
    }
    return Promise.reject(error)
  }
)