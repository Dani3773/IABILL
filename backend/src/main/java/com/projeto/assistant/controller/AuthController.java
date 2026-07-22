package com.projeto.assistant.controller;

import com.projeto.assistant.dto.LoginRequestDTO;
import com.projeto.assistant.dto.LoginResponseDTO;
import com.projeto.assistant.dto.SignupRequestDTO;
import com.projeto.assistant.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public LoginResponseDTO signup(@Valid @RequestBody SignupRequestDTO request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }
}