import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Archive } from "lucide-react";

export function RetencaoDescartePage() {
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
        <Archive className="w-5 h-5 text-[#14B8A6]" />
        <h1 className="text-xl font-serif text-[#1B2233]">Retenção e Descarte</h1>
      </div>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Art. 15 e 16 da LGPD. Dado pessoal não pode ser guardado para sempre, sem motivo.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
          <h3 className="font-medium text-[#1B2233] mb-2">Por que existe um prazo</h3>
          <p className="text-sm text-[#1B2233]/65 leading-relaxed">
            O princípio da necessidade, que já vimos em Princípios, também vale pro tempo de guarda, não só pra
            quantidade de dado. Assim que a finalidade que justificou a coleta deixa de existir, cumprimento de
            contrato encerrado, obrigação legal cumprida, o dado deveria ser eliminado ou anonimizado, não continuar
            guardado indefinidamente só porque é mais fácil não decidir.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
          <h3 className="font-medium text-[#1B2233] mb-2">O que fazer quando o prazo vence</h3>
          <p className="text-sm text-[#1B2233]/65 leading-relaxed">
            Duas saídas possíveis, eliminar de verdade o dado, ou anonimizar, transformando ele de um jeito que não
            dá mais pra identificar a pessoa, mesmo com esforço técnico razoável. A escolha depende da finalidade,
            alguns dados anonimizados ainda servem pra estatística ou análise interna, mesmo sem mais identificar
            ninguém.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#14B8A6]/20 bg-[#14B8A6]/5">
          <h3 className="font-medium text-[#1B2233] mb-2">Como isso já funciona no sistema</h3>
          <p className="text-sm text-[#1B2233]/70 leading-relaxed">
            Cada atividade cadastrada no ROPA tem um campo opcional de data limite de retenção. Quando esse prazo
            passa, um aviso aparece na própria atividade, e também no Resumo de Conformidade em Pilares, sem
            precisar lembrar manualmente de revisar cada uma.
          </p>
        </div>
      </div>
    </div>
  );
}