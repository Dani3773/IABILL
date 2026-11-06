import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";

interface Principio {
  nome: string;
  explicacao: string;
  exemplo: string;
}

const PRINCIPIOS: Principio[] = [
  {
    nome: "Finalidade",
    explicacao: "O dado só pode ser tratado para um propósito específico, legítimo, e explícito. Não dá pra coletar dado \"para o que der\".",
    exemplo: "Coletar e-mail para enviar nota fiscal é uma finalidade clara. Coletar e-mail \"para usos futuros\" não é.",
  },
  {
    nome: "Adequação",
    explicacao: "O tratamento precisa ser compatível com a finalidade informada ao titular no momento da coleta.",
    exemplo: "Se a empresa coletou o telefone para agendamento, usar esse mesmo número para uma campanha de marketing sem avisar quebra esse princípio.",
  },
  {
    nome: "Necessidade",
    explicacao: "Só deve ser coletado o mínimo de dado necessário para cumprir a finalidade, nada a mais.",
    exemplo: "Pedir data de nascimento para um cadastro de newsletter, sem nenhum uso real para essa informação, viola necessidade.",
  },
  {
    nome: "Livre Acesso",
    explicacao: "O titular tem direito a consultar, de forma fácil e gratuita, como e quais dados seus estão sendo tratados.",
    exemplo: "É por isso que o sistema mantém um Portal de Solicitação do Titular, aberto ao público, sem custo.",
  },
  {
    nome: "Qualidade dos Dados",
    explicacao: "Os dados tratados devem ser exatos, claros, relevantes, e atualizados.",
    exemplo: "Manter o endereço antigo de um cliente que já avisou da mudança, sem atualizar, é uma falha desse princípio.",
  },
  {
    nome: "Transparência",
    explicacao: "O titular tem direito a informações claras sobre o tratamento, sem termos técnicos desnecessários ou letras miúdas.",
    exemplo: "Uma Política de Privacidade escrita só em juridiquês, difícil de entender, contraria esse princípio mesmo existindo formalmente.",
  },
  {
    nome: "Segurança",
    explicacao: "A empresa deve usar medidas técnicas e administrativas capazes de proteger os dados de acessos não autorizados e situações de vazamento.",
    exemplo: "Controle de acesso por papel, criptografia, e senha protegida por hash, todos já implementados no próprio sistema, são exemplos práticos desse princípio.",
  },
  {
    nome: "Prevenção",
    explicacao: "Devem existir medidas para prevenir a ocorrência de danos, não só reagir depois que eles acontecem.",
    exemplo: "Ter um processo de resposta a incidente pronto, antes de precisar dele, é prevenção. Criar esse processo só depois do vazamento acontecer, não é.",
  },
  {
    nome: "Não Discriminação",
    explicacao: "O dado pessoal não pode ser usado para fins discriminatórios, ilícitos, ou abusivos.",
    exemplo: "Negar uma vaga de emprego com base em dado de saúde obtido sem relação com a função é uma violação direta desse princípio.",
  },
  {
    nome: "Responsabilização e Prestação de Contas",
    explicacao: "A empresa deve conseguir demonstrar, a qualquer momento, que está cumprindo as regras, não basta cumprir, precisa também conseguir provar.",
    exemplo: "É exatamente essa a função da trilha de auditoria imutável do sistema, cada ação relevante fica registrada e pode ser reconstruída depois.",
  },
];

export function PrincipiosPage() {
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
        <Scale className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">Princípios da LGPD</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">
        Art. 6º da Lei nº 13.709/2018. Toda decisão sobre tratamento de dados pessoais deveria conseguir se justificar por pelo menos um desses dez princípios.
      </p>

      <div className="space-y-4">
        {PRINCIPIOS.map((p, i) => (
          <div key={p.nome} className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs text-[#B4201A]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-medium text-[#0A0A0A]">{p.nome}</h3>
            </div>
            <p className="text-sm text-[#0A0A0A]/70 leading-relaxed mb-2">{p.explicacao}</p>
            <p className="text-xs text-[#0A0A0A]/50 leading-relaxed bg-[#FBF8F8] rounded-lg p-3">
              <span className="font-medium">Exemplo prático: </span>
              {p.exemplo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}