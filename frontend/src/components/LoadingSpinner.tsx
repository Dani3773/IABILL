export function LoadingSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
      <div className="w-5 h-5 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}