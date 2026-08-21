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
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-[#14B8A6]/10 border border-[#14B8A6]/20 text-[#0d7a6d]'
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