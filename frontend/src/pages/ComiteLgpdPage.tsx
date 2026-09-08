import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";

export function ComiteLgpdPage() {
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
        <Users className="w-5 h-5 text-[#14B8A6]" />
        <h1 className="text-xl font-serif text-[#1B2233]">Comitê de LGPD</h1>
      </div>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Boa prática recomendada, não é uma exigência literal da lei, mas costuma ser o primeiro passo real de
        qualquer empresa que leva adequação a sério.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
          <h3 className="font-medium text-[#1B2233] mb-2">Por que formar um comitê</h3>
          <p className="text-sm text-[#1B2233]/65 leading-relaxed">
            Proteção de dados não é problema só de TI, nem só do Encarregado sozinho. Envolve RH, Jurídico,
            Financeiro, e qualquer setor que trate dado pessoal. Um comitê reúne representantes desses setores,
            formaliza responsabilidade, e evita que a adequação dependa de uma única pessoa lembrando de tudo
            sozinha.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
          <h3 className="font-medium text-[#1B2233] mb-2">Quem geralmente participa</h3>
          <p className="text-sm text-[#1B2233]/65 leading-relaxed">
            O Encarregado (DPO), representante de cada setor que lida com dado pessoal relevante, e alguém com
            poder de decisão, pra que o comitê tenha autoridade real, não só função consultiva sem efeito prático.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#14B8A6]/20 bg-[#14B8A6]/5">
          <h3 className="font-medium text-[#1B2233] mb-2">Como isso já funciona no sistema</h3>
          <p className="text-sm text-[#1B2233]/70 leading-relaxed">
            Ao cadastrar um usuário, existe um campo opcional de "Cargo no comitê de LGPD", tipo "Membro titular",
            "Suplente". Isso deixa registrado, de forma consultável, quem compõe o comitê da empresa, sem precisar
            de planilha separada.
          </p>
        </div>
      </div>
    </div>
  );
}