package com.projeto.assistant.dto;

import java.util.UUID;

// workspaceName: unidade de origem do trecho. A busca cobre todas as unidades da
// mesma empresa, entao a IA precisa saber de onde veio cada trecho.
public record SemanticSearchResultDTO(
        UUID documentId,
        String documentTitle,
        int chunkIndex,
        String content,
        String workspaceName,
        // Semelhança de cosseno com a consulta, de -1 a 1 (1 = mesmo sentido).
        double similarity
) {
    // Texto do trecho como entra no prompt, com a unidade e o documento de origem.
    public String asContext() {
        return "[Unidade: " + workspaceName + " | Documento: " + documentTitle + "]\n" + content;
    }
}
