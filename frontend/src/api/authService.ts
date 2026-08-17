import { apiClient } from './client'
import type {
  AuthMeResponse,
  LoginRequest,
  SignupRequest,
  SignupResponse,
  EmailConfirmationResponse,
  UserActivationRequest,
} from '../types/auth'

export async function login(request: LoginRequest): Promise<AuthMeResponse> {
  const response = await apiClient.post<AuthMeResponse>('/auth/login', request)
  return response.data
}

export async function signup(request: SignupRequest): Promise<SignupResponse> {
  const response = await apiClient.post<SignupResponse>('/auth/signup', request)
  return response.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchCurrentUser(): Promise<AuthMeResponse> {
  const response = await apiClient.get<AuthMeResponse>('/auth/me')
  return response.data
}

export async function confirmEmail(token: string): Promise<EmailConfirmationResponse> {
  const response = await apiClient.get<EmailConfirmationResponse>(`/auth/confirm-email/${token}`)
  return response.data
}

export async function resendConfirmation(request: LoginRequest): Promise<EmailConfirmationResponse> {
  const response = await apiClient.post<EmailConfirmationResponse>('/auth/resend-confirmation', request)
  return response.data
}

export async function activateAccount(request: UserActivationRequest): Promise<EmailConfirmationResponse> {
  const response = await apiClient.post<EmailConfirmationResponse>('/users/activate', request)
  return response.data
}