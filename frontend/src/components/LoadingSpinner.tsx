export function LoadingSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-[#0A0A0A]/50">
      <div className="w-5 h-5 border-2 border-[#0A0A0A]/15 border-t-[#D92B21] rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}