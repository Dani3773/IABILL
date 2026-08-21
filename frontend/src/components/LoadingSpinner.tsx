export function LoadingSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-[#1B2233]/50">
      <div className="w-5 h-5 border-2 border-[#1B2233]/15 border-t-[#14B8A6] rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}