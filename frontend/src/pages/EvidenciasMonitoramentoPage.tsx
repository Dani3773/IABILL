import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";

export function EvidenciasMonitoramentoPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0d7a6d] hover:text-[#14B8A6] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Pilares
      </Link>

      <div className="flex items-center gap-2.5 mb-1">
        <ScrollText className="w-5 h-5 text-[#14B8A6]" />
        <h1 className="text-xl font-serif text-[#1B2233]">Evidências e Monitoramento</h1>
      </div>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Princípio da prestação de contas (accountability), Art. 6º da LGPD.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
          <h3 className="font-medium text-[#1B2233] mb-2">Cumprir a lei não basta, precisa conseguir provar</h3>
          <p className="text-sm text-[#1B2233]/65 leading-relaxed">
            Se a ANPD, ou um titular, perguntar "quando vocês corrigiram esse dado?", ou "quem aprovou essa
            política?", a resposta não pode ser "confiem em nós". Precisa existir registro real, com data, autor, e
            o que exatamente mudou.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#14B8A6]/20 bg-[#14B8A6]/5">
          <h3 className="font-medium text-[#1B2233] mb-2">Como isso já funciona no sistema</h3>
          <p className="text-sm text-[#1B2233]/70 leading-relaxed">
            Toda ação relevante, criação, aprovação, rejeição, geração por IA, mudança de status, fica registrada
            numa trilha de auditoria imutável, com quem fez, quando, e o que mudou. Isso inclui até o que a própria
            inteligência artificial gerou, e quem revisou e aprovou depois. A trilha pode ser consultada, e
            exportada em CSV, na aba Auditoria.
          </p>
        </div>
      </div>
    </div>
  );
}