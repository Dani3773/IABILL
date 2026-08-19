package com.projeto.assistant.repository;

import com.projeto.assistant.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByWorkspaceId(UUID workspaceId);
}