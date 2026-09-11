package com.projeto.assistant.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.AuditLogRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentPdfService {

    private static final Map<DocumentType, String> TYPE_LABELS = Map.of(
            DocumentType.INVENTARIO_DADOS, "Inventário de Dados",
            DocumentType.POLITICA_PRIVACIDADE, "Política de Privacidade",
            DocumentType.RELATORIO_CONFORMIDADE, "Relatório de Conformidade",
            DocumentType.RAT, "Registro de Atividades de Tratamento (RAT)",
            DocumentType.RIPD_DPIA, "Relatório de Impacto à Proteção de Dados (RIPD/DPIA)",
            DocumentType.POLITICA_SEGURANCA_INFORMACAO, "Política de Segurança da Informação (PSI)",
            DocumentType.MATERIAL_TREINAMENTO, "Material de Treinamento"
    );

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm").withZone(ZoneId.of("America/Sao_Paulo"));

    private final DocumentService documentService;
    private final AuditLogRepository auditLogRepository;
    private final WorkspaceRepository workspaceRepository;

    // Documento e retornado ja validado (posse por tenant confirmada) pelo
    // proprio DocumentService, reaproveitando a mesma checagem de acesso
    // usada em todo o resto do sistema.
    @Transactional(readOnly = true)
    public byte[] generatePdf(java.util.UUID documentId, java.util.UUID authTenantId) {
        var documentDto = documentService.findById(documentId, authTenantId);

        if (documentDto.status() != DocumentStatus.APPROVED) {
            throw new IllegalArgumentException("Só é possível exportar em PDF documentos aprovados (status atual: " + documentDto.status() + ")");
        }

        // Busca, dentro da trilha de auditoria do tenant, o evento de aprovacao
        // mais recente para este documento especifico - e a unica fonte real
        // de "quem aprovou e quando", ja que o Document em si nao guarda isso.
        var approvalEvent = auditLogRepository.findByTenantIdOrderByCreatedAtDesc(authTenantId).stream()
                .filter(log -> log.getEntityType() == AuditEntityType.DOCUMENT)
                .filter(log -> log.getEntityId().equals(documentId))
                .filter(log -> log.getAction() == AuditAction.APPROVE)
                .max(Comparator.comparing(AuditLog::getCreatedAt))
                .orElse(null);

        String approvedByName = approvalEvent != null && approvalEvent.getUser() != null
                ? approvalEvent.getUser().getUsername()
                : "Não identificado";
        String approvedAt = approvalEvent != null
                ? DATE_FORMATTER.format(approvalEvent.getCreatedAt())
                : "Não identificado";

        String workspaceName = workspaceRepository.findById(documentDto.workspaceId())
                .map(w -> w.getName())
                .orElse("Empresa não identificada");
        String documentTitle = documentDto.title();
        String typeLabel = TYPE_LABELS.getOrDefault(documentDto.type(), documentDto.type().name());
        String content = documentDto.generatedContent() != null ? documentDto.generatedContent() : "";

        String html = buildHtml(workspaceName, documentTitle, typeLabel, content, approvedByName, approvedAt);

        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);
            builder.run();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível gerar o PDF: " + e.getMessage(), e);
        }
    }

    private String buildHtml(String workspaceName, String title, String typeLabel, String content,
                             String approvedBy, String approvedAt) {
        // Paragrafos separados por linha em branco no texto original viram
        // paragrafos HTML reais - preserva a formatacao legivel do conteudo.
        String contentHtml = markdownToHtml(content);

        return """
            <html>
            <head>
            <style>
                @page {
                    size: A4;
                    margin: 2.5cm 2cm 3cm 2cm;
                    @bottom-center {
                        content: "Página " counter(page) " de " counter(pages);
                        font-family: 'Helvetica', sans-serif;
                        font-size: 9px;
                        color: #666666;
                    }
                    @top-center {
                        content: "%s — %s";
                        font-family: 'Helvetica', sans-serif;
                        font-size: 8px;
                        color: #999999;
                    }
                }
                body { font-family: 'Helvetica', sans-serif; color: #1B2233; font-size: 11px; line-height: 1.6; }
                .cover { page-break-after: always; text-align: center; padding-top: 8cm; }
                .cover .brand { font-size: 14px; letter-spacing: 3px; color: #14B8A6; text-transform: uppercase; margin-bottom: 2cm; }
                .cover .doc-type { font-size: 12px; letter-spacing: 2px; color: #B8862B; text-transform: uppercase; margin-bottom: 0.5cm; }
                .cover h1 { font-size: 26px; font-weight: bold; margin-bottom: 1cm; }
                .cover .company { font-size: 14px; color: #1B2233; margin-bottom: 3cm; }
                .cover .meta { font-size: 10px; color: #666666; border-top: 1px solid #dddddd; padding-top: 0.5cm; display: inline-block; text-align: left; }
                .cover .meta div { margin-bottom: 0.2cm; }
                h2 { font-size: 13px; margin-top: 0.8cm; margin-bottom: 0.3cm; color: #1B2233; }
                ul { margin-bottom: 0.4cm; padding-left: 1cm; }
                li { margin-bottom: 0.15cm; text-align: justify; }
                hr { border: none; border-top: 1px solid #dddddd; margin: 0.5cm 0; }
                p { text-align: justify; margin-bottom: 0.4cm; }
                .disclaimer { font-size: 8px; color: #999999; margin-top: 2cm; border-top: 1px solid #eeeeee; padding-top: 0.3cm; }
            </style>
            </head>
            <body>
                <div class="cover">
                    <div class="brand">IABill</div>
                    <div class="doc-type">%s</div>
                    <h1>%s</h1>
                    <div class="company">%s</div>
                    <div class="meta">
                        <div>Aprovado por: %s</div>
                        <div>Data de aprovação: %s</div>
                        <div>Documento gerado com apoio de inteligência artificial, revisado e aprovado por responsável humano antes da emissão deste arquivo.</div>
                    </div>
                </div>
                <div class="content">
                    %s
                    <div class="disclaimer">
                        Este documento foi gerado pelo sistema IABill e reflete o conteúdo aprovado até a data de emissão deste PDF.
                        Alterações posteriores ao documento original não são refletidas automaticamente neste arquivo.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(title, typeLabel, typeLabel, escapeHtml(title), escapeHtml(workspaceName),
                escapeHtml(approvedBy), approvedAt, contentHtml);
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    // Conversor simples de Markdown para HTML, cobre o subconjunto que a IA
    // realmente produz (negrito, linhas em negrito puro como pseudo-titulo,
    // listas com marcador), sem depender de uma biblioteca externa completa.
    private String markdownToHtml(String markdown) {
        String[] lines = markdown.split("\n");
        StringBuilder html = new StringBuilder();
        boolean inList = false;

        for (String rawLine : lines) {
            String line = rawLine.trim();

            if (line.isEmpty()) {
                if (inList) {
                    html.append("</ul>");
                    inList = false;
                }
                continue;
            }

            boolean isBullet = line.startsWith("* ") || line.startsWith("- ");
            if (isBullet) {
                if (!inList) {
                    html.append("<ul>");
                    inList = true;
                }
                String itemText = line.substring(2).trim();
                html.append("<li>").append(applyInlineFormatting(itemText)).append("</li>");
                continue;
            }

            if (inList) {
                html.append("</ul>");
                inList = false;
            }

            // Linha inteira em negrito (ex: "**1. Visão Geral**") vira subtitulo,
            // padrao comum de como a IA estrutura secoes dentro do texto gerado.
            boolean isWholeLineBold = line.startsWith("**") && line.endsWith("**") && line.length() > 4;
            if (isWholeLineBold) {
                String headingText = line.substring(2, line.length() - 2).trim();
                html.append("<h2>").append(escapeHtml(headingText)).append("</h2>");
            } else if (line.equals("---")) {
                html.append("<hr/>");
            } else {
                html.append("<p>").append(applyInlineFormatting(line)).append("</p>");
            }
        }

        if (inList) {
            html.append("</ul>");
        }

        return html.toString();
    }

    // Aplica negrito e italico dentro de uma linha ja destinada a virar <p> ou <li> -
    // escapa o HTML primeiro, so depois reintroduz as tags de formatacao, evitando
    // que o proprio conteudo do documento seja interpretado como marcacao HTML real.
    private String applyInlineFormatting(String text) {
        String escaped = escapeHtml(text);
        escaped = escaped.replaceAll("\\*\\*(.+?)\\*\\*", "<strong>$1</strong>");
        escaped = escaped.replaceAll("(?<!\\*)\\*([^*]+?)\\*(?!\\*)", "<em>$1</em>");
        return escaped;
    }
}