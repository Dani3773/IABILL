package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.*;
import com.projeto.assistant.service.AuthService;
import com.projeto.assistant.service.CnpjLookupService;
import com.projeto.assistant.service.CepLookupService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String COOKIE_NAME = "auth_token";

    private final AuthService authService;

    private final CnpjLookupService cnpjLookupService;

    private final CepLookupService cepLookupService;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site}")
    private String cookieSameSite;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @PostMapping("/signup")
    public SignupResponseDTO signup(@Valid @RequestBody SignupRequestDTO request) {
        return authService.signup(request);
    }

    @GetMapping("/cnpj/{cnpj}")
    public CnpjLookupResponseDTO lookupCnpj(@PathVariable String cnpj) {
        return cnpjLookupService.lookup(cnpj);
    }

    @GetMapping("/cep/{cep}")
    public CepLookupResponseDTO lookupCep(@PathVariable String cep) {
        return cepLookupService.lookup(cep);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthMeResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO result = authService.login(request);
        return buildAuthResponse(result);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(0) // expira imediatamente, apagando o cookie
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @GetMapping("/me")
    public AuthMeResponseDTO me(
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId,
            @RequestAttribute(value = JwtAuthenticationFilter.ATTR_TENANT_ID, required = false) UUID authTenantId,
            HttpServletRequest request) {
        String role = (String) request.getAttribute(JwtAuthenticationFilter.ATTR_ROLE);
        return new AuthMeResponseDTO(authUserId, authTenantId, role);
    }

    private ResponseEntity<AuthMeResponseDTO> buildAuthResponse(LoginResponseDTO result) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, result.token())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/")
                .maxAge(jwtExpirationMs / 1000)
                .build();

        AuthMeResponseDTO body = new AuthMeResponseDTO(result.userId(), result.tenantId(), result.role());

        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    @GetMapping("/confirm-email/{token}")
    public EmailConfirmationResponseDTO confirmEmail(@PathVariable String token) {
        return authService.confirmEmail(token);
    }

    @PostMapping("/resend-confirmation")
    public EmailConfirmationResponseDTO resendConfirmation(@Valid @RequestBody LoginRequestDTO request) {
        return authService.resendConfirmation(request);
    }
}