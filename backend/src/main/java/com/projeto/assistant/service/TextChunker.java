package com.projeto.assistant.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TextChunker {

    private static final int CHUNK_SIZE = 1000;   // caracteres por pedaco
    private static final int CHUNK_OVERLAP = 150;  // sobreposicao entre pedacos, para nao cortar contexto no meio

    public List<String> chunk(String text) {
        List<String> chunks = new ArrayList<>();

        if (text == null || text.isBlank()) {
            return chunks;
        }

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + CHUNK_SIZE, text.length());
            chunks.add(text.substring(start, end));

            if (end == text.length()) {
                break;
            }
            start = end - CHUNK_OVERLAP;
        }

        return chunks;
    }
}