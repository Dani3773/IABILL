package com.projeto.assistant.controller;

import com.projeto.assistant.dto.UserRequestDTO;
import com.projeto.assistant.dto.UserResponseDTO;
import com.projeto.assistant.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDTO create(@Valid @RequestBody UserRequestDTO request) {
        return userService.create(request);
    }

    @GetMapping
    public List<UserResponseDTO> findAll() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public UserResponseDTO findById(@PathVariable UUID id) {
        return userService.findById(id);
    }
}