package com.projeto.assistant.service;

import com.projeto.assistant.dto.LoginRequestDTO;
import com.projeto.assistant.dto.LoginResponseDTO;
import com.projeto.assistant.dto.SignupRequestDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.projeto.assistant.repository.WorkspaceRepository workspaceRepository;

    // Cria o Tenant (conta), o primeiro Workspace (a empresa de verdade, com CNPJ/
    // endereco/regime legal) e o primeiro usuario (ADMIN), tudo de forma atomica, e
    // ja retorna logado. Este e o UNICO endpoint publico que cria dados no sistema.
    //
    // NOTA (13/08/2026): Tenant.documentId e Tenant.country nao sao mais preenchidos
    // aqui - esses dados agora pertencem ao Workspace, que e a entidade legal real
    // (uma conta/Tenant pode ter varios Workspaces, cada um com seu proprio CNPJ).
    // As colunas antigas continuam existindo no banco por seguranca, mas ficam nulas
    // para contas novas a partir de agora.
    @Transactional
    public LoginResponseDTO signup(SignupRequestDTO request) {
        Tenant tenant = new Tenant();
        tenant.setName(request.tenantName());
        Tenant savedTenant = tenantRepository.save(tenant);

        Workspace workspace = new Workspace();
        workspace.setTenant(savedTenant);
        workspace.setName(request.workspaceName());
        workspace.setType(WorkspaceType.MATRIZ);
        workspace.setDocumentId(request.workspaceDocumentId());
        workspace.setCountry(request.workspaceCountry());
        workspace.setState(request.workspaceState());
        workspace.setCity(request.workspaceCity());
        workspace.setNeighborhood(request.workspaceNeighborhood());
        workspace.setPostalCode(request.workspacePostalCode());
        workspace.setStreet(request.workspaceStreet());
        workspace.setAddressNumber(request.workspaceAddressNumber());
        workspace.setPhone(request.workspacePhone());
        workspace.setLegalRegimes(request.workspaceLegalRegimes());
        workspaceRepository.save(workspace);

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

        UUID tenantId = matchedUser.getTenant() != null ? matchedUser.getTenant().getId() : null;
        String token = jwtService.generateToken(matchedUser.getId(), tenantId, matchedUser.getRole().name());
        return new LoginResponseDTO(token, matchedUser.getId(), tenantId, matchedUser.getRole().name());
    }
}