import { useParams, Link } from "react-router-dom";
import { ClipboardList, ArrowRight } from "lucide-react";

export function PilaresPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div>
      <h1 className="text-xl font-serif text-[#1B2233] mb-1">Pilares de Conformidade</h1>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Visão geral do estado de adequação deste workspace, por pilar da LGPD/RGPD.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to={`/workspaces/${workspaceId}/pilares/ropa`}
          className="bg-white rounded-xl p-5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#1B2233]/25" />
          </div>
          <h3 className="font-medium text-[#1B2233] mb-1">Inventário / ROPA</h3>
          <p className="text-xs text-[#1B2233]/50">
            Registro estruturado das atividades de tratamento de dados pessoais.
          </p>
        </Link>
      </div>
    </div>
  );
}