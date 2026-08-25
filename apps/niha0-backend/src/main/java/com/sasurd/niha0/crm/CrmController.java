package com.sasurd.niha0.crm;

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
    public List<Customer> listCustomers() {
        return crmService.listCustomers();
    }

    @PostMapping("/customers")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES','MEMBER')")
    public Customer createCustomer(@RequestBody Customer customer) {
        return crmService.createCustomer(customer);
    }

    @GetMapping("/customers/{id}")
    public Customer getCustomer(@PathVariable UUID id) {
        return crmService.getCustomer(id);
    }

    @PutMapping("/customers/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','SALES')")
    public Customer updateCustomer(@PathVariable UUID id, @RequestBody Customer customer) {
        return crmService.updateCustomer(id, customer);
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
}
