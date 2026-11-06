import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users2 } from "lucide-react";

import { tr } from '../i18n/tr'
interface Papel {
  nome: string;
  explicacao: string;
  noSistema: string;
}

const PAPEIS: Papel[] = [
  {
    nome: tr('Controlador'),
    explicacao: tr('Quem decide o que fazer com o dado pessoal, para qual finalidade, e como. Geralmente é a própria empresa que você está representando no sistema.'),
    noSistema: tr('É a empresa cliente cadastrada, com suas unidades.'),
  },
  {
    nome: tr('Operador'),
    explicacao: tr('Quem trata dado pessoal em nome do controlador, seguindo as instruções dele. Nuvem, folha de pagamento, ferramenta de IA, todos são operadores quando processam dado da sua empresa.'),
    noSistema: tr('É o que o sistema chama de Fornecedor/Terceiro, menu Fornecedores.'),
  },
  {
    nome: tr('Encarregado (DPO)'),
    explicacao: tr('A pessoa que faz a ponte entre a empresa, os titulares, e a ANPD. Recebe reclamação, orienta funcionário, e responde formalmente por questões de proteção de dados.'),
    noSistema: tr('É um papel atribuído a um usuário, aba Usuários.'),
  },
  {
    nome: tr('Titular'),
    explicacao: tr('A pessoa natural cujos dados estão sendo tratados, cliente, funcionário, candidato, qualquer um.'),
    noSistema: tr('Nunca tem conta no sistema, mas pode enviar solicitação pelo Portal público.'),
  },
  {
    nome: tr('ANPD'),
    explicacao: tr('Agência Nacional de Proteção de Dados, a agência reguladora responsável por fiscalizar e aplicar a LGPD no Brasil, com fiscalização ativa.'),
    noSistema: tr('Não interage diretamente com o sistema, mas várias funcionalidades existem para produzir a documentação que ela pode exigir.'),
  },
];

export function QuemEQuemPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar ao Guia LGPD')}</Link>

      <div className="flex items-center gap-2.5 mb-1">
        <Users2 className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">{tr('Quem é Quem')}</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">{tr('Os papéis que a LGPD define, e como cada um aparece dentro do próprio sistema.')}</p>

      <div className="space-y-3">
        {PAPEIS.map((p) => (
          <div key={p.nome} className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10">
            <h3 className="font-medium text-[#0A0A0A] mb-1">{p.nome}</h3>
            <p className="text-sm text-[#0A0A0A]/65 leading-relaxed mb-2">{p.explicacao}</p>
            <p className="text-xs text-[#0A0A0A] bg-[#D92B21]/8 rounded-lg px-3 py-2">{p.noSistema}</p>
          </div>
        ))}
      </div>
    </div>
  );
}