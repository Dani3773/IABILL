import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

interface Termo {
  nome: string;
  explicacao: string;
}

const TERMOS: Termo[] = [
  {
    nome: "Dado Pessoal",
    explicacao: "Qualquer informação que identifique ou possa identificar uma pessoa natural, nome, e-mail, CPF, endereço, localização, ou até um identificador de dispositivo.",
  },
  {
    nome: "Dado Pessoal Sensível",
    explicacao: "Categoria especial de dado pessoal, sobre origem racial, convicção religiosa, opinião política, saúde, vida sexual, dado genético, ou biométrico. Exige cuidado redobrado, e frequentemente exige um RIPD/DPIA.",
  },
  {
    nome: "Titular",
    explicacao: "A pessoa natural a quem os dados pessoais se referem. É quem tem os direitos previstos no Art. 18 da LGPD.",
  },
  {
    nome: "Tratamento",
    explicacao: "Qualquer operação feita com dado pessoal, coleta, produção, recepção, classificação, uso, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação, controle, modificação, comunicação, transferência, difusão, ou extração.",
  },
  {
    nome: "Anonimização",
    explicacao: "Processo que torna impossível associar um dado a uma pessoa, de forma irreversível, mesmo usando meios técnicos razoáveis disponíveis. Dado anonimizado deixa de ser considerado dado pessoal.",
  },
  {
    nome: "Pseudonimização",
    explicacao: "Diferente de anonimização, aqui o dado ainda pode ser associado à pessoa, mas só usando uma informação adicional guardada separadamente, com controle de acesso próprio.",
  },
  {
    nome: "Consentimento",
    explicacao: "Manifestação livre, informada, e inequívoca pela qual o titular concorda com o tratamento dos seus dados para uma finalidade específica.",
  },
  {
    nome: "Incidente de Segurança",
    explicacao: "Qualquer evento adverso, confirmado ou suspeito, relacionado à violação da segurança de dados pessoais, tipo acesso não autorizado, vazamento, ou destruição acidental.",
  },
];

export function GlossarioPage() {
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
        <BookOpen className="w-5 h-5 text-[#14B8A6]" />
        <h1 className="text-xl font-serif text-[#1B2233]">Glossário de Termos</h1>
      </div>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Art. 5º da LGPD. Termos que aparecem em várias telas do sistema, explicados em linguagem simples.
      </p>

      <div className="space-y-3">
        {TERMOS.map((t) => (
          <div key={t.nome} className="bg-white rounded-xl p-4 border border-[#1B2233]/10">
            <h3 className="font-medium text-[#1B2233] mb-1">{t.nome}</h3>
            <p className="text-sm text-[#1B2233]/65 leading-relaxed">{t.explicacao}</p>
          </div>
        ))}
      </div>
    </div>
  );
}