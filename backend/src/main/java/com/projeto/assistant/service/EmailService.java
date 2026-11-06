package com.projeto.assistant.service;

import com.projeto.assistant.config.MessageCatalog;
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

        String subject = MessageCatalog.t("Confirme sua conta no IABill");
        String body = MessageCatalog.t("""
                Olá, %s,

                Sua conta na plataforma IABill foi criada. Para confirmar seu e-mail, acesse:

                %s

                Se você não solicitou este cadastro, pode ignorar este e-mail.

                Equipe IABill
                """).formatted(username, confirmUrl);

        send(toEmail, subject, body);
    }

    public void sendUserInvitation(String toEmail, String username, String inviterTenantName, String token) {
        String activationUrl = "https://iabill.com/ativar-conta/" + token;

        String subject = MessageCatalog.t("Você foi convidado para o IABill");
        String body = MessageCatalog.t("""
                Olá, %s,

                Você foi convidado para acessar o IABill como parte da conta de %s.

                Para definir sua senha e ativar seu acesso, clique no link abaixo:

                %s

                Se você não esperava este convite, pode ignorar este e-mail.

                Equipe IABill
                """).formatted(username, inviterTenantName, activationUrl);

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

    public void sendPasswordReset(String toEmail, String username, String tenantName, String token) {
        String resetUrl = "https://iabill.com/redefinir-senha/" + token;

        String subject = MessageCatalog.t("Redefinir senha da sua conta em " + tenantName);
        String body = MessageCatalog.t("""
                Olá, %s,

                Recebemos uma solicitação para redefinir a senha da sua conta no IABill,
                vinculada à empresa %s.

                Para escolher uma nova senha, acesse:

                %s

                Se você não solicitou essa redefinição, pode ignorar este e-mail com segurança -
                sua senha atual continua válida.

                Equipe IABill
                """).formatted(username, tenantName, resetUrl);

        send(toEmail, subject, body);
    }
}