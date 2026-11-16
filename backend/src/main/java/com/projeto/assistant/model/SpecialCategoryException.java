package com.projeto.assistant.model;

// Exceções do Art. 9.º, n.º 2 do RGPD que permitem tratar categorias especiais de
// dados (saúde, biometria, origem étnica...). No RGPD, além da base do Art. 6.º,
// o tratamento desses dados precisa de uma destas exceções.
public enum SpecialCategoryException {
    EXPLICIT_CONSENT,            // a) consentimento explícito
    EMPLOYMENT_SOCIAL_SECURITY,  // b) direito do trabalho e segurança social
    VITAL_INTERESTS,             // c) interesses vitais, titular incapaz de consentir
    NOT_FOR_PROFIT_BODY,         // d) fundação, associação ou organismo sem fins lucrativos
    MADE_PUBLIC_BY_SUBJECT,      // e) dados tornados públicos pelo próprio titular
    LEGAL_CLAIMS,                // f) declaração, exercício ou defesa de direitos em processo
    SUBSTANTIAL_PUBLIC_INTEREST, // g) interesse público importante, com base em lei
    HEALTH_OR_SOCIAL_CARE,       // h) medicina preventiva ou do trabalho, saúde e ação social
    PUBLIC_HEALTH,               // i) interesse público no domínio da saúde pública
    ARCHIVING_RESEARCH           // j) arquivo de interesse público, investigação científica ou estatística
}
