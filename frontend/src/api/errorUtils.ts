import { AxiosError } from 'axios'

interface BackendErrorBody {
  message?: string
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as BackendErrorBody | undefined
    if (body?.message) {
      return body.message
    }
  }
  return fallback
}