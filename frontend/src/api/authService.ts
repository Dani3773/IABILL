import { apiClient } from './client'
import type {
  AuthMeResponse,
  LoginRequest,
  SignupRequest,
  SignupResponse,
  EmailConfirmationResponse,
  UserActivationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MfaVerifyRequest,
  MfaRequiredResponse,
  MfaStatusResponse,
  MfaSetupResponse,
} from '../types/auth'

export async function login(request: LoginRequest): Promise<AuthMeResponse | MfaRequiredResponse> {
  const response = await apiClient.post<AuthMeResponse | MfaRequiredResponse>('/auth/login', request)
  return response.data
}

export async function loginWithMfa(request: MfaVerifyRequest): Promise<AuthMeResponse> {
  const response = await apiClient.post<AuthMeResponse>('/auth/login/mfa', request)
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

export async function forgotPassword(request: ForgotPasswordRequest): Promise<EmailConfirmationResponse> {
  const response = await apiClient.post<EmailConfirmationResponse>('/auth/forgot-password', request)
  return response.data
}

export async function resetPassword(request: ResetPasswordRequest): Promise<EmailConfirmationResponse> {
  const response = await apiClient.post<EmailConfirmationResponse>('/auth/reset-password', request)
  return response.data
}

export async function fetchMfaStatus(): Promise<MfaStatusResponse> {
  const response = await apiClient.get<MfaStatusResponse>('/mfa/status')
  return response.data
}

export async function startMfaSetup(): Promise<MfaSetupResponse> {
  const response = await apiClient.post<MfaSetupResponse>('/mfa/setup')
  return response.data
}

export async function confirmMfaSetup(code: number): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/mfa/confirm', { code })
  return response.data
}

export async function disableMfa(): Promise<void> {
  await apiClient.delete('/mfa')
}