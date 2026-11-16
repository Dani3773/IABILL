import { useParams, Link } from "react-router-dom";
import { useLegalRegime } from '../hooks/useLegalRegime'
import { ArrowLeft, BookOpen } from "lucide-react";

import { tr } from '../i18n/tr'
import { RegimeSections, RegimeText } from '../components/RegimeContent'
interface Termo {
  nome: string;
  explicacao: string;
}

const TERMOS_LGPD: Termo[] = [
  {
    nome: tr('Dado Pessoal'),
    explicacao: tr('Qualquer informação que identifique ou possa identificar uma pessoa natural, nome, e-mail, CPF, endereço, localização, ou até um identificador de dispositivo.'),
  },
  {
    nome: tr('Dado Pessoal Sensível'),
    explicacao: tr('Categoria especial de dado pessoal, sobre origem racial, convicção religiosa, opinião política, saúde, vida sexual, dado genético, ou biométrico. Exige cuidado redobrado, e frequentemente exige um RIPD/DPIA.'),
  },
  {
    nome: tr('Titular'),
    explicacao: tr('A pessoa natural a quem os dados pessoais se referem. É quem tem os direitos previstos no Art. 18 da LGPD.'),
  },
  {
    nome: tr('Tratamento'),
    explicacao: tr('Qualquer operação feita com dado pessoal, coleta, produção, recepção, classificação, uso, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação, controle, modificação, comunicação, transferência, difusão, ou extração.'),
  },
  {
    nome: tr('Anonimização'),
    explicacao: tr('Processo que torna impossível associar um dado a uma pessoa, de forma irreversível, mesmo usando meios técnicos razoáveis disponíveis. Dado anonimizado deixa de ser considerado dado pessoal.'),
  },
  {
    nome: tr('Pseudonimização'),
    explicacao: tr('Diferente de anonimização, aqui o dado ainda pode ser associado à pessoa, mas só usando uma informação adicional guardada separadamente, com controle de acesso próprio.'),
  },
  {
    nome: tr('Consentimento'),
    explicacao: tr('Manifestação livre, informada, e inequívoca pela qual o titular concorda com o tratamento dos seus dados para uma finalidade específica.'),
  },
  {
    nome: tr('Incidente de Segurança'),
    explicacao: tr('Qualquer evento adverso, confirmado ou suspeito, relacionado à violação da segurança de dados pessoais, tipo acesso não autorizado, vazamento, ou destruição acidental.'),
  },
];

const TERMOS_RGPD: Termo[] = [
  {
    nome: tr('Dado Pessoal'),
    explicacao: tr('Informação relativa a uma pessoa singular identificada ou identificável, nome, e-mail, número de identificação fiscal, endereço, localização, ou até um identificador por via eletrônica (Art. 4, n.º 1).'),
  },
  {
    nome: tr('Categorias Especiais de Dados'),
    explicacao: tr('Dados que revelem origem racial ou étnica, opiniões políticas, convicções religiosas, filiação sindical, dados genéticos, biométricos, de saúde, ou sobre a vida e orientação sexual (Art. 9). Em regra o tratamento é proibido, salvo nas exceções do próprio artigo, e frequentemente exige uma avaliação de impacto (AIPD/DPIA).'),
  },
  {
    nome: tr('Titular'),
    explicacao: tr('A pessoa singular a quem os dados pessoais dizem respeito. É quem tem os direitos previstos nos Arts. 15 a 22 do RGPD.'),
  },
  {
    nome: tr('Tratamento'),
    explicacao: tr('Qualquer operação feita com dados pessoais, por meios automatizados ou não, como recolha, registro, organização, conservação, consulta, utilização, divulgação, comparação, limitação, apagamento ou destruição (Art. 4, n.º 2).'),
  },
  {
    nome: tr('Anonimização'),
    explicacao: tr('Processo que torna impossível associar um dado a uma pessoa, de forma irreversível, mesmo usando meios técnicos razoáveis disponíveis. Dado anonimizado deixa de ser considerado dado pessoal.'),
  },
  {
    nome: tr('Pseudonimização'),
    explicacao: tr('Tratamento que impede atribuir os dados a um titular sem informação adicional, mantida separadamente e protegida (Art. 4, n.º 5). Dado pseudonimizado continua sendo dado pessoal.'),
  },
  {
    nome: tr('Consentimento'),
    explicacao: tr('Manifestação de vontade livre, específica, informada e inequívoca, por declaração ou ato positivo claro, pela qual o titular aceita o tratamento dos seus dados (Art. 4, n.º 11). Pode ser retirado a qualquer momento.'),
  },
  {
    nome: tr('Violação de Dados Pessoais'),
    explicacao: tr('Violação da segurança que provoque, de modo acidental ou ilícito, a destruição, perda, alteração, divulgação ou acesso não autorizados a dados pessoais (Art. 4, n.º 12). Deve ser notificada à autoridade de controlo em até 72 horas (Art. 33).'),
  },
];

export function GlossarioPage() {
  const { lawName } = useLegalRegime()
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar ao Guia {{lei}}', { lei: lawName })}</Link>

      <div className="flex items-center gap-2.5 mb-1">
        <BookOpen className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">{tr('Glossário de Termos')}</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6"><RegimeText lgpd={tr('Art. 5º da LGPD. Termos que aparecem em várias telas do sistema, explicados em linguagem simples.')} rgpd={tr('Art. 4 do RGPD. Termos que aparecem em várias telas do sistema, explicados em linguagem simples.')} /></p>

      <RegimeSections lgpd={TERMOS_LGPD} rgpd={TERMOS_RGPD} render={(termos) => (
      <div className="space-y-3">
        {termos.map((t) => (
          <div key={t.nome} className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10">
            <h3 className="font-medium text-[#0A0A0A] mb-1">{t.nome}</h3>
            <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">{t.explicacao}</p>
          </div>
        ))}
      </div>
      )} />
    </div>
  );
}