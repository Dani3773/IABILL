package com.projeto.assistant.controller;

import com.projeto.assistant.dto.LoginRequestDTO;
import com.projeto.assistant.dto.LoginResponseDTO;
import com.projeto.assistant.model.User;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        User user = userRepository.findByTenantIdAndEmail(request.tenantId(), request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
        }

        String token = jwtService.generateToken(user.getId(), user.getTenant().getId(), user.getRole().name());

        return new LoginResponseDTO(token, user.getId(), user.getTenant().getId(), user.getRole().name());
    }
}