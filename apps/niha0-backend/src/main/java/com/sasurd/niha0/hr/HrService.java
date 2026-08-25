package com.sasurd.niha0.hr;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class HrService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public HrService(EmployeeRepository employeeRepository, LeaveRequestRepository leaveRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    @Transactional(readOnly = true)
    public List<Employee> listEmployees() {
        return employeeRepository.findByOrganizationIdOrderByLastNameAsc(orgId());
    }

    @Transactional
    public Employee createEmployee(Employee employee) {
        employee.setOrganizationId(orgId());
        if (employee.getStatus() == null || employee.getStatus().isBlank()) employee.setStatus("ACTIVE");
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee updateEmployee(UUID id, Employee update) {
        Employee existing = employeeRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Employee not found"));
        if (update.getFirstName() != null) existing.setFirstName(update.getFirstName());
        if (update.getLastName() != null) existing.setLastName(update.getLastName());
        if (update.getEmail() != null) existing.setEmail(update.getEmail());
        if (update.getJobTitle() != null) existing.setJobTitle(update.getJobTitle());
        if (update.getDepartment() != null) existing.setDepartment(update.getDepartment());
        if (update.getStatus() != null) existing.setStatus(update.getStatus());
        if (update.getHiredAt() != null) existing.setHiredAt(update.getHiredAt());
        return employeeRepository.save(existing);
    }

    @Transactional
    public void deleteEmployee(UUID id) {
        Employee existing = employeeRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Employee not found"));
        employeeRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> listLeaves() {
        return leaveRequestRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public LeaveRequest createLeave(LeaveRequest leave) {
        UUID org = orgId();
        employeeRepository.findByIdAndOrganizationId(leave.getEmployeeId(), org)
                .orElseThrow(() -> new ApiException(404, "Employee not found"));
        leave.setOrganizationId(org);
        if (leave.getStatus() == null || leave.getStatus().isBlank()) leave.setStatus("PENDING");
        if (leave.getLeaveType() == null || leave.getLeaveType().isBlank()) leave.setLeaveType("ANNUAL");
        if (leave.getStartDate() != null && leave.getEndDate() != null) {
            long days = ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1;
            leave.setDays((int) Math.max(1, days));
        }
        return leaveRequestRepository.save(leave);
    }

    @Transactional
    public LeaveRequest decideLeave(UUID id, String status) {
        LeaveRequest leave = leaveRequestRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Leave request not found"));
        String normalized = status == null ? "" : status.toUpperCase();
        if (!List.of("APPROVED", "REJECTED", "CANCELLED").contains(normalized)) {
            throw new ApiException(400, "Invalid leave status");
        }
        leave.setStatus(normalized);
        leave.setDecidedBy(SecurityUtils.currentUserId());
        return leaveRequestRepository.save(leave);
    }

    @Transactional
    public void deleteLeave(UUID id) {
        LeaveRequest leave = leaveRequestRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Leave request not found"));
        leaveRequestRepository.delete(leave);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
