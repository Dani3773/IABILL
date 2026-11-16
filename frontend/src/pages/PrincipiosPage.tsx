import { useParams, Link } from "react-router-dom";
import { useLegalRegime } from '../hooks/useLegalRegime'
import { ArrowLeft, Scale } from "lucide-react";

import { tr } from '../i18n/tr'
import { RegimeSections, RegimeText } from '../components/RegimeContent'
interface Principio {
  nome: string;
  explicacao: string;
  exemplo: string;
}

const PRINCIPIOS_LGPD: Principio[] = [
  {
    nome: tr('Finalidade'),
    explicacao: tr('O dado só pode ser tratado para um propósito específico, legítimo, e explícito. Não dá pra coletar dado "para o que der".'),
    exemplo: tr('Coletar e-mail para enviar nota fiscal é uma finalidade clara. Coletar e-mail "para usos futuros" não é.'),
  },
  {
    nome: tr('Adequação'),
    explicacao: tr('O tratamento precisa ser compatível com a finalidade informada ao titular no momento da coleta.'),
    exemplo: tr('Se a empresa coletou o telefone para agendamento, usar esse mesmo número para uma campanha de marketing sem avisar quebra esse princípio.'),
  },
  {
    nome: tr('Necessidade'),
    explicacao: tr('Só deve ser coletado o mínimo de dado necessário para cumprir a finalidade, nada a mais.'),
    exemplo: tr('Pedir data de nascimento para um cadastro de newsletter, sem nenhum uso real para essa informação, viola necessidade.'),
  },
  {
    nome: tr('Livre Acesso'),
    explicacao: tr('O titular tem direito a consultar, de forma fácil e gratuita, como e quais dados seus estão sendo tratados.'),
    exemplo: tr('É por isso que o sistema mantém um Portal de Solicitação do Titular, aberto ao público, sem custo.'),
  },
  {
    nome: tr('Qualidade dos Dados'),
    explicacao: tr('Os dados tratados devem ser exatos, claros, relevantes, e atualizados.'),
    exemplo: tr('Manter o endereço antigo de um cliente que já avisou da mudança, sem atualizar, é uma falha desse princípio.'),
  },
  {
    nome: tr('Transparência'),
    explicacao: tr('O titular tem direito a informações claras sobre o tratamento, sem termos técnicos desnecessários ou letras miúdas.'),
    exemplo: tr('Uma Política de Privacidade escrita só em juridiquês, difícil de entender, contraria esse princípio mesmo existindo formalmente.'),
  },
  {
    nome: tr('Segurança'),
    explicacao: tr('A empresa deve usar medidas técnicas e administrativas capazes de proteger os dados de acessos não autorizados e situações de vazamento.'),
    exemplo: tr('Controle de acesso por papel, criptografia, e senha protegida por hash, todos já implementados no próprio sistema, são exemplos práticos desse princípio.'),
  },
  {
    nome: tr('Prevenção'),
    explicacao: tr('Devem existir medidas para prevenir a ocorrência de danos, não só reagir depois que eles acontecem.'),
    exemplo: tr('Ter um processo de resposta a incidente pronto, antes de precisar dele, é prevenção. Criar esse processo só depois do vazamento acontecer, não é.'),
  },
  {
    nome: tr('Não Discriminação'),
    explicacao: tr('O dado pessoal não pode ser usado para fins discriminatórios, ilícitos, ou abusivos.'),
    exemplo: tr('Negar uma vaga de emprego com base em dado de saúde obtido sem relação com a função é uma violação direta desse princípio.'),
  },
  {
    nome: tr('Responsabilização e Prestação de Contas'),
    explicacao: tr('A empresa deve conseguir demonstrar, a qualquer momento, que está cumprindo as regras, não basta cumprir, precisa também conseguir provar.'),
    exemplo: tr('É exatamente essa a função da trilha de auditoria imutável do sistema, cada ação relevante fica registrada e pode ser reconstruída depois.'),
  },
];

const PRINCIPIOS_RGPD: Principio[] = [
  {
    nome: tr('Licitude, Lealdade e Transparência'),
    explicacao: tr('O tratamento precisa de uma base legal do Art. 6, deve ser leal com o titular, e ele precisa saber de forma clara o que é feito com os seus dados.'),
    exemplo: tr('Uma Política de Privacidade escrita em linguagem simples, que diz quais dados são usados e para quê, atende a este princípio.'),
  },
  {
    nome: tr('Limitação das Finalidades'),
    explicacao: tr('Os dados são recolhidos para finalidades determinadas, explícitas e legítimas, e não podem depois ser usados de forma incompatível com elas.'),
    exemplo: tr('Usar o e-mail recolhido para enviar a fatura numa campanha de marketing, sem base legal própria, viola este princípio.'),
  },
  {
    nome: tr('Minimização dos Dados'),
    explicacao: tr('Os dados devem ser adequados, pertinentes e limitados ao necessário para a finalidade.'),
    exemplo: tr('Pedir data de nascimento para um cadastro de newsletter, sem nenhum uso real para essa informação, viola a minimização.'),
  },
  {
    nome: tr('Exatidão'),
    explicacao: tr('Os dados devem ser exatos e atualizados; os inexatos devem ser apagados ou retificados sem demora.'),
    exemplo: tr('Manter o endereço antigo de um cliente que já avisou da mudança, sem atualizar, é uma falha deste princípio.'),
  },
  {
    nome: tr('Limitação da Conservação'),
    explicacao: tr('Os dados só podem ser guardados de forma que identifique o titular durante o tempo necessário para a finalidade.'),
    exemplo: tr('O campo de data limite de retenção de cada atividade do ROPA existe para cumprir este princípio.'),
  },
  {
    nome: tr('Integridade e Confidencialidade'),
    explicacao: tr('O tratamento deve garantir a segurança dos dados, com medidas técnicas e organizativas contra acesso não autorizado, perda ou destruição.'),
    exemplo: tr('Controle de acesso por papel, criptografia, e senha protegida por hash, todos já implementados no próprio sistema, são exemplos práticos deste princípio.'),
  },
  {
    nome: tr('Responsabilidade'),
    explicacao: tr('O responsável pelo tratamento cumpre os princípios e tem de conseguir demonstrar esse cumprimento (Art. 5, n.º 2).'),
    exemplo: tr('É exatamente essa a função da trilha de auditoria imutável do sistema, cada ação relevante fica registrada e pode ser reconstruída depois.'),
  },
];

export function PrincipiosPage() {
  const { lr, lawName } = useLegalRegime()
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar ao Guia {{lei}}', { lei: lawName })}</Link>

      <div className="flex items-center gap-2.5 mb-1">
        <Scale className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">{lr(tr('Princípios da LGPD'), tr('Princípios do RGPD'), tr('Princípios da LGPD e do RGPD'))}</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6"><RegimeText lgpd={tr('Art. 6º da Lei nº 13.709/2018. Toda decisão sobre tratamento de dados pessoais deveria conseguir se justificar por pelo menos um desses dez princípios.')} rgpd={tr('Art. 5 do Regulamento (UE) 2016/679. Toda decisão sobre tratamento de dados pessoais deveria conseguir se justificar por estes sete princípios.')} /></p>

      <RegimeSections lgpd={PRINCIPIOS_LGPD} rgpd={PRINCIPIOS_RGPD} render={(principios) => (
      <div className="space-y-4">
        {principios.map((p, i) => (
          <div key={p.nome} className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs text-[#B4201A]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-medium text-[#0A0A0A]">{p.nome}</h3>
            </div>
            <p className="text-sm text-[#0A0A0A]/70 leading-relaxed mb-2">{p.explicacao}</p>
            <p className="text-xs text-[#0A0A0A]/50 leading-relaxed bg-[#fbfaf6] rounded-lg p-3">
              <span className="font-medium">{tr('Exemplo prático:')}{' '}</span>
              {p.exemplo}
            </p>
          </div>
        ))}
      </div>
      )} />
    </div>
  );
}