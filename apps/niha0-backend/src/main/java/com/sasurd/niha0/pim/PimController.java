package com.sasurd.niha0.pim;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pim/products")
@PreAuthorize("isAuthenticated()")
public class PimController {

    private final PimService pimService;

    public PimController(PimService pimService) {
        this.pimService = pimService;
    }

    @GetMapping
    public List<PimProduct> list() {
        return pimService.listProducts();
    }

    @GetMapping("/{id}")
    public PimProduct get(@PathVariable UUID id) {
        return pimService.getProduct(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('pim.write')")
    public PimProduct create(@RequestBody PimProduct product) {
        return pimService.createProduct(product);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('pim.write')")
    public PimProduct update(@PathVariable UUID id, @RequestBody PimProduct product) {
        return pimService.updateProduct(id, product);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('pim.write')")
    public void delete(@PathVariable UUID id) {
        pimService.deleteProduct(id);
    }

    @GetMapping("/{id}/variants")
    public List<PimVariant> listVariants(@PathVariable UUID id) {
        return pimService.listVariants(id);
    }

    @PostMapping("/{id}/variants")
    @PreAuthorize("hasAuthority('pim.write')")
    public PimVariant createVariant(@PathVariable UUID id, @RequestBody PimVariant variant) {
        return pimService.createVariant(id, variant);
    }
}
