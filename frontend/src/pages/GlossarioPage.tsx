import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

import { tr } from '../i18n/tr'
interface Termo {
  nome: string;
  explicacao: string;
}

const TERMOS: Termo[] = [
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

export function GlossarioPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar ao Guia LGPD')}</Link>

      <div className="flex items-center gap-2.5 mb-1">
        <BookOpen className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">{tr('Glossário de Termos')}</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">{tr('Art. 5º da LGPD. Termos que aparecem em várias telas do sistema, explicados em linguagem simples.')}</p>

      <div className="space-y-3">
        {TERMOS.map((t) => (
          <div key={t.nome} className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10">
            <h3 className="font-medium text-[#0A0A0A] mb-1">{t.nome}</h3>
            <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">{t.explicacao}</p>
          </div>
        ))}
      </div>
    </div>
  );
}