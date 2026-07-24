import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // essencial: manda o cookie httpOnly em toda requisicao
})