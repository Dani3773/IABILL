package com.projeto.assistant.service;

import com.projeto.assistant.dto.LoginRequestDTO;
import com.projeto.assistant.dto.LoginResponseDTO;
import com.projeto.assistant.dto.SignupRequestDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // Cria o Tenant e o primeiro usuario (ADMIN) de forma atomica, e ja retorna logado.
    // Este e o UNICO endpoint publico que cria dados no sistema.
    @Transactional
    public LoginResponseDTO signup(SignupRequestDTO request) {
        Tenant tenant = new Tenant();
        tenant.setName(request.tenantName());
        tenant.setDocumentId(request.tenantDocumentId());
        tenant.setCountry(request.tenantCountry());
        Tenant savedTenant = tenantRepository.save(tenant);

        User user = new User();
        user.setTenant(savedTenant);
        user.setUsername(request.adminUsername());
        user.setEmail(request.adminEmail());
        user.setPasswordHash(passwordEncoder.encode(request.adminPassword()));
        user.setRole(UserRole.ADMIN);
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser.getId(), savedTenant.getId(), savedUser.getRole().name());
        return new LoginResponseDTO(token, savedUser.getId(), savedTenant.getId(), savedUser.getRole().name());
    }

    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO request) {
        // Busca TODOS os usuarios com esse e-mail, em qualquer tenant (email e unico
        // POR tenant, nao globalmente - ver decisao de design da modelagem de User).
        List<User> candidates = userRepository.findByEmail(request.email());

        // Filtra pelo primeiro cujo hash de senha bate. Na pratica, e-mails corporativos
        // sao globalmente unicos (dominio da empresa garante isso), entao colisao real
        // entre tenants e praticamente impossivel - mas o codigo trata o caso mesmo assim.
        // LIMITACAO CONHECIDA E DOCUMENTADA: se por algum motivo o mesmo par e-mail+senha
        // existir em mais de um tenant, o primeiro encontrado "ganha" - aceitavel para o
        // escopo atual do projeto, mas anotado na tasklist para revisitar se necessario.
        User matchedUser = candidates.stream()
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));

        String token = jwtService.generateToken(matchedUser.getId(), matchedUser.getTenant().getId(), matchedUser.getRole().name());
        return new LoginResponseDTO(token, matchedUser.getId(), matchedUser.getTenant().getId(), matchedUser.getRole().name());
    }
}