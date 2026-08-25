package com.sasurd.niha0.legal;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ContractService {

    private final ContractRepository contractRepository;

    public ContractService(ContractRepository contractRepository) {
        this.contractRepository = contractRepository;
    }

    @Transactional(readOnly = true)
    public List<Contract> listContracts() {
        return contractRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public Contract createContract(Contract contract) {
        contract.setOrganizationId(orgId());
        return contractRepository.save(contract);
    }

    @Transactional(readOnly = true)
    public Contract getContract(UUID id) {
        return contractRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Contract not found"));
    }

    @Transactional
    public Contract updateContract(UUID id, Contract update) {
        Contract existing = getContract(id);
        if (update.getTitle() != null) existing.setTitle(update.getTitle());
        if (update.getCategory() != null) existing.setCategory(update.getCategory());
        if (update.getStatus() != null) existing.setStatus(update.getStatus());
        if (update.getStartDate() != null) existing.setStartDate(update.getStartDate());
        if (update.getEndDate() != null) existing.setEndDate(update.getEndDate());
        if (update.getContent() != null) existing.setContent(update.getContent());
        return contractRepository.save(existing);
    }

    @Transactional
    public void deleteContract(UUID id) {
        Contract existing = getContract(id);
        contractRepository.delete(existing);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
