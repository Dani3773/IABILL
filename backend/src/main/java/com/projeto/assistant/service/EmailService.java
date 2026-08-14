package com.projeto.assistant.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;

/**
 * Envio de e-mail via AWS SES. Autenticacao via IAM Role da instancia
 * (aws-elasticbeanstalk-ec2-role) - sem chave de acesso fixa, mesma
 * filosofia de "sem credencial permanente" ja usada no CI/CD.
 *
 * Padrao "opcional": falha de envio nunca propaga excecao - o fluxo
 * principal (signup, reset de senha, convite) nao pode quebrar so
 * porque um e-mail falhou ao sair. Log de warning para investigacao.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String FROM_ADDRESS = "IABill <noreply@iabill.com>";

    private final SesV2Client sesClient;

    public EmailService() {
        this.sesClient = SesV2Client.builder()
                .region(Region.SA_EAST_1)
                .build();
    }

    public void sendEmailConfirmation(String toEmail, String username, String token) {
        String confirmUrl = "https://iabill.com/confirmar-email/" + token;

        String subject = "Confirme sua conta no IABill";
        String body = """
                Olá, %s,

                Sua conta na plataforma IABill foi criada. Para confirmar seu e-mail, acesse:

                %s

                Se você não solicitou este cadastro, pode ignorar este e-mail.

                Equipe IABill
                """.formatted(username, confirmUrl);

        send(toEmail, subject, body);
    }

    private void send(String toEmail, String subject, String body) {
        try {
            SendEmailRequest request = SendEmailRequest.builder()
                    .fromEmailAddress(FROM_ADDRESS)
                    .destination(Destination.builder().toAddresses(toEmail).build())
                    .content(EmailContent.builder()
                            .simple(Message.builder()
                                    .subject(Content.builder().data(subject).build())
                                    .body(Body.builder()
                                            .text(Content.builder().data(body).build())
                                            .build())
                                    .build())
                            .build())
                    .build();

            sesClient.sendEmail(request);
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail para {}: {}", toEmail, e.getMessage());
        }
    }
}