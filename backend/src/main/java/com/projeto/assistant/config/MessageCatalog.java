package com.projeto.assistant.config;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Traduz para o idioma do pedido as mensagens que o backend devolve. O texto em
// portugues do Brasil continua no codigo e serve de chave: sem traducao, ele sai
// como esta. O frontend informa o idioma no cabecalho Accept-Language.
//
// Na chave, {} marca um trecho variavel, como o id de "Workspace nao encontrado: {}".
public final class MessageCatalog {

    private static final String SOURCE_LANGUAGE = "pt-BR";
    private static final String CATALOG_PATH = "/i18n/messages.json";

    private record DynamicMessage(Pattern pattern, String translation) {
    }

    private static final Map<String, Map<String, String>> EXACT = loadCatalog();
    private static final Map<String, List<DynamicMessage>> DYNAMIC = compileDynamicMessages();

    private MessageCatalog() {
    }

    public static String t(String message) {
        return translate(message, currentLanguage());
    }

    static String translate(String message, String language) {
        if (message == null || SOURCE_LANGUAGE.equals(language)) {
            return message;
        }

        String exact = EXACT.getOrDefault(language, Map.of()).get(message);
        if (exact != null) {
            return exact;
        }

        for (DynamicMessage dynamic : DYNAMIC.getOrDefault(language, List.of())) {
            Matcher matcher = dynamic.pattern().matcher(message);
            if (matcher.matches()) {
                return fill(dynamic.translation(), matcher);
            }
        }
        return message;
    }

    // Sem pedido em andamento, ou sem cabecalho, vale o portugues do Brasil.
    public static String currentLanguage() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return SOURCE_LANGUAGE;
        }
        return resolveLanguage(attributes.getRequest().getHeader("Accept-Language"));
    }

    static String resolveLanguage(String header) {
        if (header == null || header.isBlank()) {
            return SOURCE_LANGUAGE;
        }
        String first = header.split(",")[0].split(";")[0].trim().toLowerCase();
        if (first.equals("pt-pt")) {
            return "pt-PT";
        }
        if (first.startsWith("pt")) {
            return SOURCE_LANGUAGE;
        }
        return "en";
    }

    // Instrucao acrescentada aos prompts, para a IA escrever no idioma do pedido.
    public static String aiLanguageInstruction() {
        return switch (currentLanguage()) {
            case "en" -> "Escreva toda a resposta em inglês, mesmo que o contexto esteja em português.";
            case "pt-PT" -> "Escreva toda a resposta em português de Portugal, com a terminologia oficial do RGPD.";
            default -> "Escreva toda a resposta em português do Brasil.";
        };
    }

    private static String fill(String translation, Matcher matcher) {
        String result = translation;
        for (int group = 1; group <= matcher.groupCount(); group++) {
            result = result.replaceFirst(Pattern.quote("{}"), Matcher.quoteReplacement(matcher.group(group)));
        }
        return result;
    }

    private static Map<String, Map<String, String>> loadCatalog() {
        try (InputStream input = MessageCatalog.class.getResourceAsStream(CATALOG_PATH)) {
            if (input == null) {
                throw new IllegalStateException("Catalogo de mensagens ausente: " + CATALOG_PATH);
            }
            return new ObjectMapper().readValue(input, new TypeReference<>() {
            });
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static Map<String, List<DynamicMessage>> compileDynamicMessages() {
        return EXACT.entrySet().stream().collect(java.util.stream.Collectors.toMap(
                Map.Entry::getKey,
                language -> {
                    List<DynamicMessage> messages = new ArrayList<>();
                    language.getValue().forEach((key, translation) -> {
                        if (key.contains("{}")) {
                            messages.add(new DynamicMessage(toPattern(key), translation));
                        }
                    });
                    return messages;
                }));
    }

    private static Pattern toPattern(String key) {
        String[] parts = key.split(Pattern.quote("{}"), -1);
        StringBuilder regex = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                regex.append("(.*)");
            }
            regex.append(Pattern.quote(parts[i]));
        }
        return Pattern.compile(regex.toString(), Pattern.DOTALL);
    }
}
