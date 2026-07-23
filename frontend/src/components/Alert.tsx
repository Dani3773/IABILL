import { AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  type: 'error' | 'success'
  message: string
}

export function Alert({ type, message }: Props) {
  const isError = type === 'error'
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm ${
        isError
          ? 'bg-red-950/50 border border-red-900/50 text-red-400'
          : 'bg-green-950/50 border border-green-900/50 text-green-400'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
  )
}