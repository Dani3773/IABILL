import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";

import { tr } from '../i18n/tr'
export function EvidenciasMonitoramentoPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar ao Guia LGPD')}</Link>

      <div className="flex items-center gap-2.5 mb-1">
        <ScrollText className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">{tr('Evidências e Monitoramento')}</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">{tr('Princípio da prestação de contas (accountability), Art. 6º da LGPD.')}</p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
          <h3 className="font-medium text-[#0A0A0A] mb-2">{tr('Cumprir a lei não basta, precisa conseguir provar')}</h3>
          <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">{tr('Se a ANPD, ou um titular, perguntar "quando vocês corrigiram esse dado?", ou "quem aprovou essa política?", a resposta não pode ser "confiem em nós". Precisa existir registro real, com data, autor, e o que exatamente mudou.')}</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#D92B21]/20 bg-[#D92B21]/5">
          <h3 className="font-medium text-[#0A0A0A] mb-2">{tr('Como isso já funciona no sistema')}</h3>
          <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">{tr('Toda ação relevante, criação, aprovação, rejeição, geração por IA, mudança de status, fica registrada numa trilha de auditoria imutável, com quem fez, quando, e o que mudou. Isso inclui até o que a própria inteligência artificial gerou, e quem revisou e aprovou depois. A trilha pode ser consultada, e exportada em CSV, na aba Auditoria.')}</p>
        </div>
      </div>
    </div>
  );
}