import { apiClient } from './client'
import type { AuthMeResponse, LoginRequest, SignupRequest } from '../types/auth'

export async function login(request: LoginRequest): Promise<AuthMeResponse> {
  const response = await apiClient.post<AuthMeResponse>('/auth/login', request)
  return response.data
}

export async function signup(request: SignupRequest): Promise<AuthMeResponse> {
  const response = await apiClient.post<AuthMeResponse>('/auth/signup', request)
  return response.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchCurrentUser(): Promise<AuthMeResponse> {
  const response = await apiClient.get<AuthMeResponse>('/auth/me')
  return response.data
}