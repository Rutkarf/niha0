package com.sasurd.niha0.crm;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CrmService {

    private final CustomerRepository customerRepository;
    private final ContactRepository contactRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final TaskRepository taskRepository;

    public CrmService(CustomerRepository customerRepository,
                      ContactRepository contactRepository,
                      LeadRepository leadRepository,
                      OpportunityRepository opportunityRepository,
                      TaskRepository taskRepository) {
        this.customerRepository = customerRepository;
        this.contactRepository = contactRepository;
        this.leadRepository = leadRepository;
        this.opportunityRepository = opportunityRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<Customer> listCustomers() {
        return customerRepository.findByOrganizationIdOrderByNameAsc(orgId());
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
        customer.setOrganizationId(orgId());
        return customerRepository.save(customer);
    }

    @Transactional(readOnly = true)
    public Customer getCustomer(UUID id) {
        return customerRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Customer not found"));
    }

    @Transactional
    public Customer updateCustomer(UUID id, Customer update) {
        Customer existing = getCustomer(id);
        existing.setName(update.getName());
        existing.setEmail(update.getEmail());
        existing.setPhone(update.getPhone());
        existing.setIndustry(update.getIndustry());
        existing.setStatus(update.getStatus());
        return customerRepository.save(existing);
    }

    @Transactional
    public void deleteCustomer(UUID id) {
        Customer existing = getCustomer(id);
        customerRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    public List<Contact> listContacts() {
        return contactRepository.findByOrganizationIdOrderByLastNameAsc(orgId());
    }

    @Transactional
    public Contact createContact(Contact contact) {
        contact.setOrganizationId(orgId());
        return contactRepository.save(contact);
    }

    @Transactional(readOnly = true)
    public List<Lead> listLeads() {
        return leadRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Lead createLead(Lead lead) {
        lead.setOrganizationId(orgId());
        return leadRepository.save(lead);
    }

    @Transactional
    public Lead updateLead(UUID id, Lead update) {
        Lead existing = leadRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Lead not found"));
        if (update.getCompanyName() != null) existing.setCompanyName(update.getCompanyName());
        if (update.getContactName() != null) existing.setContactName(update.getContactName());
        if (update.getEmail() != null) existing.setEmail(update.getEmail());
        if (update.getPhone() != null) existing.setPhone(update.getPhone());
        if (update.getSource() != null) existing.setSource(update.getSource());
        if (update.getStatus() != null) existing.setStatus(update.getStatus());
        existing.setScore(update.getScore());
        return leadRepository.save(existing);
    }

    @Transactional
    public void deleteLead(UUID id) {
        Lead existing = leadRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Lead not found"));
        leadRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    public List<Opportunity> listOpportunities() {
        return opportunityRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Opportunity createOpportunity(Opportunity opportunity) {
        opportunity.setOrganizationId(orgId());
        return opportunityRepository.save(opportunity);
    }

    @Transactional
    public Opportunity updateOpportunity(UUID id, Opportunity update) {
        Opportunity existing = opportunityRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Opportunity not found"));
        if (update.getTitle() != null) existing.setTitle(update.getTitle());
        if (update.getStage() != null) existing.setStage(update.getStage());
        if (update.getAmount() != null) existing.setAmount(update.getAmount());
        existing.setProbability(update.getProbability());
        if (update.getExpectedClose() != null) existing.setExpectedClose(update.getExpectedClose());
        if (update.getCustomerId() != null) existing.setCustomerId(update.getCustomerId());
        return opportunityRepository.save(existing);
    }

    @Transactional
    public void deleteOpportunity(UUID id) {
        Opportunity existing = opportunityRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Opportunity not found"));
        opportunityRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    public List<Task> listTasks() {
        return taskRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Task createTask(Task task) {
        task.setOrganizationId(orgId());
        return taskRepository.save(task);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
