package com.sasurd.niha0.crm;

import com.sasurd.niha0.crm.dto.CustomerRequest;
import com.sasurd.niha0.crm.dto.CustomerResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/crm")
public class CrmController {

    private final CrmService crmService;

    public CrmController(CrmService crmService) {
        this.crmService = crmService;
    }

    @GetMapping("/customers")
    public List<CustomerResponse> listCustomers() {
        return crmService.listCustomers().stream().map(CrmController::toCustomerResponse).toList();
    }

    @PostMapping("/customers")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES','MEMBER')")
    public CustomerResponse createCustomer(@Valid @RequestBody CustomerRequest request) {
        Customer customer = new Customer();
        customer.setName(request.name());
        customer.setEmail(request.email());
        customer.setPhone(request.phone());
        customer.setIndustry(request.industry());
        if (request.status() != null && !request.status().isBlank()) {
            customer.setStatus(request.status());
        }
        return toCustomerResponse(crmService.createCustomer(customer));
    }

    @GetMapping("/customers/{id}")
    public CustomerResponse getCustomer(@PathVariable UUID id) {
        return toCustomerResponse(crmService.getCustomer(id));
    }

    @PutMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES')")
    public CustomerResponse updateCustomer(@PathVariable UUID id, @Valid @RequestBody CustomerRequest request) {
        Customer update = new Customer();
        update.setName(request.name());
        update.setEmail(request.email());
        update.setPhone(request.phone());
        update.setIndustry(request.industry());
        update.setStatus(request.status() == null || request.status().isBlank() ? "ACTIVE" : request.status());
        return toCustomerResponse(crmService.updateCustomer(id, update));
    }

    @DeleteMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public void deleteCustomer(@PathVariable UUID id) {
        crmService.deleteCustomer(id);
    }

    @GetMapping("/contacts")
    public List<Contact> listContacts() {
        return crmService.listContacts();
    }

    @PostMapping("/contacts")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES','MEMBER')")
    public Contact createContact(@RequestBody Contact contact) {
        return crmService.createContact(contact);
    }

    @GetMapping("/leads")
    public List<Lead> listLeads() {
        return crmService.listLeads();
    }

    @PostMapping("/leads")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES')")
    public Lead createLead(@RequestBody Lead lead) {
        return crmService.createLead(lead);
    }

    @PutMapping("/leads/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES')")
    public Lead updateLead(@PathVariable UUID id, @RequestBody Lead lead) {
        return crmService.updateLead(id, lead);
    }

    @DeleteMapping("/leads/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public void deleteLead(@PathVariable UUID id) {
        crmService.deleteLead(id);
    }

    @GetMapping("/opportunities")
    public List<Opportunity> listOpportunities() {
        return crmService.listOpportunities();
    }

    @PostMapping("/opportunities")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES')")
    public Opportunity createOpportunity(@RequestBody Opportunity opportunity) {
        return crmService.createOpportunity(opportunity);
    }

    @PutMapping("/opportunities/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES')")
    public Opportunity updateOpportunity(@PathVariable UUID id, @RequestBody Opportunity opportunity) {
        return crmService.updateOpportunity(id, opportunity);
    }

    @DeleteMapping("/opportunities/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public void deleteOpportunity(@PathVariable UUID id) {
        crmService.deleteOpportunity(id);
    }

    @GetMapping("/tasks")
    public List<Task> listTasks() {
        return crmService.listTasks();
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES','MEMBER')")
    public Task createTask(@RequestBody Task task) {
        return crmService.createTask(task);
    }

    private static CustomerResponse toCustomerResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getIndustry(),
                customer.getStatus(),
                customer.getCreatedAt(),
                customer.getUpdatedAt());
    }
}
