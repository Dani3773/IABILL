package com.projeto.assistant.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TextChunkerTest {

    private final TextChunker chunker = new TextChunker();

    @Test
    void chunk_withShortText_shouldReturnSingleChunk() {
        String text = "Texto curto de teste.";
        List<String> chunks = chunker.chunk(text);

        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0)).isEqualTo(text);
    }

    @Test
    void chunk_withEmptyOrNullText_shouldReturnEmptyList() {
        assertThat(chunker.chunk("")).isEmpty();
        assertThat(chunker.chunk(null)).isEmpty();
    }

    @Test
    void chunk_withLongText_shouldSplitWithOverlapPreserved() {
        String longText = "a".repeat(2500);
        List<String> chunks = chunker.chunk(longText);

        assertThat(chunks.size()).isGreaterThan(1);

        // Confirma que o overlap de 150 caracteres realmente se repete entre chunks consecutivos
        String endOfFirst = chunks.get(0).substring(chunks.get(0).length() - 150);
        String startOfSecond = chunks.get(1).substring(0, 150);
        assertThat(endOfFirst).isEqualTo(startOfSecond);
    }
}