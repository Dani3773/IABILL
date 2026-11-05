package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.dto.DocumentRequestDTO;
import com.projeto.assistant.dto.EmployeeRequestDTO;
import com.projeto.assistant.dto.TrainingRequestDTO;
import com.projeto.assistant.dto.WorkspaceRequestDTO;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.DocumentType;
import com.projeto.assistant.model.Employee;
import com.projeto.assistant.model.LegalRegime;
import com.projeto.assistant.model.Sector;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.TrainingMethod;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.repository.EmployeeRepository;
import com.projeto.assistant.repository.SectorRepository;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TenantIsolationIntegrationTest extends IntegrationTestBase {

    @Autowired private UserService userService;
    @Autowired private WorkspaceService workspaceService;
    @Autowired private DocumentService documentService;
    @Autowired private DocumentChunkService documentChunkService;
    @Autowired private EmployeeService employeeService;
    @Autowired private TrainingService trainingService;
    @Autowired private AuditLogService auditLogService;

    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private SectorRepository sectorRepository;
    @Autowired private EmployeeRepository employeeRepository;

    private Tenant tenantA;
    private Tenant tenantB;
    private Workspace workspaceA;
    private Workspace workspaceB;
    private User adminA;
    private User adminB;
    private User superAdmin;

    @BeforeEach
    void setUp() {
        tenantA = newTenant("Empresa A");
        tenantB = newTenant("Empresa B");
        workspaceA = newWorkspace(tenantA);
        workspaceB = newWorkspace(tenantB);
        adminA = newUser(tenantA, UserRole.ADMIN);
        adminB = newUser(tenantB, UserRole.ADMIN);
        superAdmin = newUser(null, UserRole.SUPER_ADMIN);
    }

    private Tenant newTenant(String name) {
        Tenant tenant = new Tenant();
        tenant.setName(name);
        return tenantRepository.save(tenant);
    }

    private Workspace newWorkspace(Tenant tenant) {
        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);
        workspace.setName("Workspace " + tenant.getName());
        workspace.setType(WorkspaceType.MATRIZ);
        workspace.setDocumentId(randomDocumentId());
        return workspaceRepository.save(workspace);
    }

    private User newUser(Tenant tenant, UserRole role) {
        User user = new User();
        user.setTenant(tenant);
        user.setUsername("teste." + role.name().toLowerCase());
        user.setEmail("teste." + UUID.randomUUID() + "@iabill-test.com");
        user.setPasswordHash("nao-sera-usado-neste-teste");
        user.setRole(role);
        return userRepository.save(user);
    }

    private String randomDocumentId() {
        return String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 14);
    }

    @Test
    void findById_withUserOfOtherTenant_shouldThrowAccessDeniedException() {
        assertThatThrownBy(() -> userService.findById(adminB.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void findById_withUserOfSameTenant_shouldReturnUser() {
        var found = userService.findById(adminA.getId(), adminA.getId());

        assertThat(found.id()).isEqualTo(adminA.getId());
    }

    @Test
    void findById_whenRequesterIsSuperAdmin_shouldReturnUserOfAnyTenant() {
        var found = userService.findById(adminB.getId(), superAdmin.getId());

        assertThat(found.id()).isEqualTo(adminB.getId());
    }

    @Test
    void findWorkspacesOfUser_withUserOfOtherTenant_shouldThrowAccessDeniedException() {
        assertThatThrownBy(() -> userService.findWorkspacesOfUser(adminB.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void addUserToWorkspace_withWorkspaceOfOtherTenant_shouldThrowAccessDeniedException() {
        assertThatThrownBy(() -> userService.addUserToWorkspace(adminA.getId(), workspaceB.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void addUserToWorkspace_withUserOfOtherTenant_shouldThrowAccessDeniedException() {
        assertThatThrownBy(() -> userService.addUserToWorkspace(adminB.getId(), workspaceB.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createWorkspace_whenAdminSendsOtherTenantId_shouldCreateInOwnTenant() {
        var request = new WorkspaceRequestDTO(tenantB.getId(), "Filial", WorkspaceType.FILIAL, randomDocumentId(),
                "BR", null, null, null, null, null, null, null, Set.of(LegalRegime.LGPD));

        var created = workspaceService.create(request, adminA.getId());

        assertThat(workspaceRepository.findById(created.id()).orElseThrow().getTenant().getId())
                .isEqualTo(tenantA.getId());
    }

    @Test
    void createDocument_inWorkspaceOfOtherTenant_shouldThrowAccessDeniedException() {
        var request = new DocumentRequestDTO(workspaceB.getId(), DocumentType.RIPD_DPIA, "Intruso");

        assertThatThrownBy(() -> documentService.create(request, tenantA.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createDocument_shouldRecordAuthenticatedUserAsAuthorInDocumentAndAuditLog() {
        var request = new DocumentRequestDTO(workspaceA.getId(), DocumentType.RIPD_DPIA, "Documento autoral");

        var created = documentService.create(request, tenantA.getId(), adminA.getId());

        assertThat(created.createdByUserId()).isEqualTo(adminA.getId());
        assertThat(auditLogService.findByTenant(tenantA.getId()))
                .anyMatch(log -> log.entityId().equals(created.id())
                        && log.action() == AuditAction.CREATE
                        && adminA.getId().equals(log.userId()));
    }

    @Test
    void processContent_withDocumentOfOtherTenant_shouldThrowAccessDeniedException() {
        Document document = new Document();
        document.setWorkspace(workspaceB);
        document.setType(DocumentType.RIPD_DPIA);
        document.setTitle("Documento da empresa B");
        UUID documentId = documentRepository.save(document).getId();

        assertThatThrownBy(() -> documentChunkService.processContent(documentId, "texto", tenantA.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createEmployee_withSectorOfOtherWorkspace_shouldThrowAccessDeniedException() {
        Sector sector = new Sector();
        sector.setWorkspace(workspaceB);
        sector.setName("Setor da empresa B");
        UUID sectorId = sectorRepository.save(sector).getId();

        var request = new EmployeeRequestDTO(workspaceA.getId(), "Colaborador", null, sectorId, null, true);

        assertThatThrownBy(() -> employeeService.create(request, tenantA.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createTraining_withAttendeeOfOtherWorkspace_shouldThrowAccessDeniedException() {
        Employee employee = new Employee();
        employee.setWorkspace(workspaceB);
        employee.setName("Colaborador da empresa B");
        employee.setCreatedBy(adminB.getId());
        UUID employeeId = employeeRepository.save(employee).getId();

        var request = new TrainingRequestDTO(workspaceA.getId(), "Treinamento", null, TrainingMethod.ONLINE,
                LocalDate.now(), List.of(employeeId));

        assertThatThrownBy(() -> trainingService.create(request, tenantA.getId(), adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }
}
