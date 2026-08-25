package com.sasurd.niha0.hr;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/hr")
public class HrController {

    private final HrService hrService;

    public HrController(HrService hrService) {
        this.hrService = hrService;
    }

    @GetMapping("/employees")
    public List<Employee> listEmployees() {
        return hrService.listEmployees();
    }

    @PostMapping("/employees")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','HR')")
    public Employee createEmployee(@RequestBody Employee employee) {
        return hrService.createEmployee(employee);
    }

    @PutMapping("/employees/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','HR')")
    public Employee updateEmployee(@PathVariable UUID id, @RequestBody Employee employee) {
        return hrService.updateEmployee(id, employee);
    }

    @DeleteMapping("/employees/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public void deleteEmployee(@PathVariable UUID id) {
        hrService.deleteEmployee(id);
    }

    @GetMapping("/leaves")
    public List<LeaveRequest> listLeaves() {
        return hrService.listLeaves();
    }

    @PostMapping("/leaves")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','HR','MEMBER')")
    public LeaveRequest createLeave(@RequestBody LeaveRequest leave) {
        return hrService.createLeave(leave);
    }

    @PostMapping("/leaves/{id}/decide")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','HR')")
    public LeaveRequest decideLeave(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return hrService.decideLeave(id, body.getOrDefault("status", "APPROVED"));
    }

    @DeleteMapping("/leaves/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','HR')")
    public void deleteLeave(@PathVariable UUID id) {
        hrService.deleteLeave(id);
    }
}
