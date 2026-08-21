import { useParams, Link } from "react-router-dom";
import {
  ClipboardList,
  Truck,
  GraduationCap,
  Building2,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { ComplianceChecklist } from "../components/ComplianceChecklist";

export function PilaresPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div>
      <h1 className="text-xl font-serif text-[#1B2233] mb-1">
        Pilares de Conformidade
      </h1>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Visão geral do estado de adequação deste workspace, por pilar da
        LGPD/RGPD.
      </p>

      {workspaceId && <ComplianceChecklist workspaceId={workspaceId} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to={`/workspaces/${workspaceId}/pilares/diagnostico`}
          className="bg-white rounded-xl p-5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#1B2233]/25" />
          </div>
          <h3 className="font-medium text-[#1B2233] mb-1">
            Diagnóstico Inicial
          </h3>
          <p className="text-xs text-[#1B2233]/50">
            Questionário rápido que gera um plano de ação personalizado.
          </p>
        </Link>

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

        <Link
          to={`/workspaces/${workspaceId}/pilares/fornecedores`}
          className="bg-white rounded-xl p-5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#1B2233]/25" />
          </div>
          <h3 className="font-medium text-[#1B2233] mb-1">
            Fornecedores / Terceiros
          </h3>
          <p className="text-xs text-[#1B2233]/50">
            Gestão de operadores com acesso a dados pessoais e seus DPAs.
          </p>
        </Link>

        <Link
          to={`/workspaces/${workspaceId}/pilares/treinamento`}
          className="bg-white rounded-xl p-5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#1B2233]/25" />
          </div>
          <h3 className="font-medium text-[#1B2233] mb-1">
            Treinamento de Colaboradores
          </h3>
          <p className="text-xs text-[#1B2233]/50">
            Registro de conscientização sobre proteção de dados.
          </p>
        </Link>

        <Link
          to={`/workspaces/${workspaceId}/pilares/setores`}
          className="bg-white rounded-xl p-5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <ArrowRight className="w-4 h-4 text-[#1B2233]/25" />
          </div>
          <h3 className="font-medium text-[#1B2233] mb-1">Setores</h3>
          <p className="text-xs text-[#1B2233]/50">
            Organize colaboradores, atividades e fornecedores por área.
          </p>
        </Link>
      </div>
    </div>
  );
}
