package com.sasurd.niha0.legal;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/legal/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping
    public List<Contract> list() {
        return contractService.listContracts();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','LEGAL','MANAGER')")
    public Contract create(@RequestBody Contract contract) {
        return contractService.createContract(contract);
    }

    @GetMapping("/{id}")
    public Contract get(@PathVariable UUID id) {
        return contractService.getContract(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','LEGAL','MANAGER')")
    public Contract update(@PathVariable UUID id, @RequestBody Contract contract) {
        return contractService.updateContract(id, contract);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public void delete(@PathVariable UUID id) {
        contractService.deleteContract(id);
    }
}
