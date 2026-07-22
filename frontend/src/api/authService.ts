import { apiClient } from './client'
import type { LoginRequest, LoginResponse, SignupRequest } from '../types/auth'

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', request)
  return response.data
}

export async function signup(request: SignupRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/signup', request)
  return response.data
}