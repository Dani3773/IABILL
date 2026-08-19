package com.projeto.assistant.service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorConfig;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.projeto.assistant.dto.MfaSetupResponseDTO;
import com.projeto.assistant.model.User;
import com.projeto.assistant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MfaService {

    private final UserRepository userRepository;

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator(
            new GoogleAuthenticatorConfig.GoogleAuthenticatorConfigBuilder().build()
    );

    // Gera um segredo novo e devolve a URI otpauth:// (o frontend gera o QR code
    // localmente a partir dela - o segredo NUNCA e enviado a nenhum servico externo).
    // Ainda nao ativa a MFA - isso so acontece apos confirmar um codigo valido em confirmSetup.
    @Transactional
    public MfaSetupResponseDTO startSetup(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        GoogleAuthenticatorKey key = gAuth.createCredentials();
        user.setMfaSecret(key.getKey());
        userRepository.save(user);

        String issuer = "IABill";
        String label = URLEncoder.encode(issuer + ":" + user.getEmail(), StandardCharsets.UTF_8);
        String otpAuthUri = "otpauth://totp/" + label
                + "?secret=" + key.getKey()
                + "&issuer=" + URLEncoder.encode(issuer, StandardCharsets.UTF_8);

        return new MfaSetupResponseDTO(otpAuthUri);
    }

    // Confirma que a pessoa configurou corretamente o autenticador (digitou um
    // codigo valido gerado a partir do segredo) - so entao a MFA fica de fato ativa.
    @Transactional
    public boolean confirmSetup(UUID userId, int code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        if (user.getMfaSecret() == null) {
            throw new IllegalStateException("Nenhuma configuração de MFA em andamento para este usuário");
        }

        boolean valid = gAuth.authorize(user.getMfaSecret(), code);
        if (valid) {
            user.setMfaEnabled(true);
            userRepository.save(user);
        }
        return valid;
    }

    @Transactional
    public void disable(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
    }

    public boolean verifyCode(User user, int code) {
        if (user.getMfaSecret() == null) return false;
        return gAuth.authorize(user.getMfaSecret(), code);
    }
}