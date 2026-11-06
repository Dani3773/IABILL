import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";

export function ComiteLgpdPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar ao Guia LGPD
      </Link>

      <div className="flex items-center gap-2.5 mb-1">
        <Users className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">Comitê de LGPD</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">
        Boa prática recomendada, não é uma exigência literal da lei, mas costuma ser o primeiro passo real de
        qualquer empresa que leva adequação a sério.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
          <h3 className="font-medium text-[#0A0A0A] mb-2">Por que formar um comitê</h3>
          <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">
            Proteção de dados não é problema só de TI, nem só do Encarregado sozinho. Envolve RH, Jurídico,
            Financeiro, e qualquer setor que trate dado pessoal. Um comitê reúne representantes desses setores,
            formaliza responsabilidade, e evita que a adequação dependa de uma única pessoa lembrando de tudo
            sozinha.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
          <h3 className="font-medium text-[#0A0A0A] mb-2">Quem geralmente participa</h3>
          <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">
            O Encarregado (DPO), representante de cada setor que lida com dado pessoal relevante, e alguém com
            poder de decisão, pra que o comitê tenha autoridade real, não só função consultiva sem efeito prático.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#D92B21]/20 bg-[#D92B21]/5">
          <h3 className="font-medium text-[#0A0A0A] mb-2">Como isso já funciona no sistema</h3>
          <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">
            Ao cadastrar um usuário, existe um campo opcional de "Cargo no comitê de LGPD", tipo "Membro titular",
            "Suplente". Isso deixa registrado, de forma consultável, quem compõe o comitê da empresa, sem precisar
            de planilha separada.
          </p>
        </div>
      </div>
    </div>
  );
}