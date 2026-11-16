package com.projeto.assistant.service;

import com.projeto.assistant.model.LegalRegime;
import com.projeto.assistant.model.Workspace;

import java.util.Set;

// Diz a IA qual lei vale para a unidade em que o usuario esta. Sem isso, os
// prompts citavam a LGPD tambem para unidades sujeitas ao RGPD (ex.: filial em
// Portugal), e o documento gerado saia com a lei errada.
public final class LegalRegimePrompt {

    private LegalRegimePrompt() {
    }

    public static String describe(Workspace workspace) {
        Set<LegalRegime> regimes = workspace.getLegalRegimes();
        boolean lgpd = regimes.isEmpty() || regimes.contains(LegalRegime.LGPD);
        boolean rgpd = regimes.contains(LegalRegime.RGPD);
        String unit = "A unidade atual é \"" + workspace.getName() + "\" (" + workspace.getType() + "). ";

        if (lgpd && rgpd) {
            return unit + """
                Ela está sujeita à LGPD (Lei 13.709/2018, Brasil) e ao RGPD (Regulamento (UE) 2016/679).
                Quando a obrigação for diferente entre as duas leis, indique o que vale em cada uma,
                citando o artigo da LGPD e o artigo do RGPD.""";
        }
        if (rgpd) {
            return unit + """
                Ela está sujeita ao RGPD (Regulamento (UE) 2016/679), e NÃO à LGPD.
                Cite apenas artigos do RGPD (ex.: Art. 5.º princípios, Art. 6.º licitude, Art. 28.º subcontratantes,
                Art. 30.º registo das atividades, Art. 32.º segurança, Art. 33.º notificação em 72 horas,
                Art. 35.º avaliação de impacto, Art. 37.º encarregado) e a autoridade de controlo do país
                (ex.: CNPD em Portugal). Não cite a LGPD nem a ANPD, nem prazos brasileiros.""";
        }
        return unit + """
            Ela está sujeita à LGPD (Lei 13.709/2018, Brasil), e NÃO ao RGPD.
            Cite artigos da LGPD e orientações e resoluções da ANPD.""";
    }

    // Nome curto do regime, para consultas de busca e textos.
    public static String shortName(Workspace workspace) {
        Set<LegalRegime> regimes = workspace.getLegalRegimes();
        boolean rgpd = regimes.contains(LegalRegime.RGPD);
        boolean lgpd = regimes.isEmpty() || regimes.contains(LegalRegime.LGPD);
        if (lgpd && rgpd) {
            return "LGPD e RGPD";
        }
        return rgpd ? "RGPD" : "LGPD";
    }
}
