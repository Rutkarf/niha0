package com.sasurd.niha0.pim;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PimService {

    private final PimProductRepository productRepository;
    private final PimVariantRepository variantRepository;

    public PimService(PimProductRepository productRepository, PimVariantRepository variantRepository) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }

    @Transactional(readOnly = true)
    public List<PimProduct> listProducts() {
        return productRepository.findByOrganizationIdOrderBySkuAsc(orgId());
    }

    @Transactional(readOnly = true)
    public PimProduct getProduct(UUID id) {
        return productRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Product not found"));
    }

    @Transactional
    public PimProduct createProduct(PimProduct product) {
        UUID orgId = orgId();
        if (product.getSku() == null || product.getSku().isBlank()) {
            throw new ApiException(400, "sku is required");
        }
        if (product.getName() == null || product.getName().isBlank()) {
            throw new ApiException(400, "name is required");
        }
        if (productRepository.existsByOrganizationIdAndSkuIgnoreCase(orgId, product.getSku())) {
            throw new ApiException(409, "SKU already exists");
        }
        product.setOrganizationId(orgId);
        if (product.getStatus() == null || product.getStatus().isBlank()) {
            product.setStatus("DRAFT");
        }
        return productRepository.save(product);
    }

    @Transactional
    public PimProduct updateProduct(UUID id, PimProduct update) {
        PimProduct existing = getProduct(id);
        if (update.getName() != null) existing.setName(update.getName());
        if (update.getDescription() != null) existing.setDescription(update.getDescription());
        if (update.getCategory() != null) existing.setCategory(update.getCategory());
        if (update.getStatus() != null) existing.setStatus(update.getStatus());
        if (update.getAttributesJson() != null) existing.setAttributesJson(update.getAttributesJson());
        if (update.getSku() != null && !update.getSku().equalsIgnoreCase(existing.getSku())) {
            if (productRepository.existsByOrganizationIdAndSkuIgnoreCase(orgId(), update.getSku())) {
                throw new ApiException(409, "SKU already exists");
            }
            existing.setSku(update.getSku());
        }
        return productRepository.save(existing);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        productRepository.delete(getProduct(id));
    }

    @Transactional(readOnly = true)
    public List<PimVariant> listVariants(UUID productId) {
        getProduct(productId);
        return variantRepository.findByOrganizationIdAndProductIdOrderBySkuAsc(orgId(), productId);
    }

    @Transactional
    public PimVariant createVariant(UUID productId, PimVariant variant) {
        getProduct(productId);
        UUID orgId = orgId();
        if (variant.getSku() == null || variant.getSku().isBlank()) {
            throw new ApiException(400, "sku is required");
        }
        if (variant.getName() == null || variant.getName().isBlank()) {
            throw new ApiException(400, "name is required");
        }
        if (variantRepository.existsByOrganizationIdAndSkuIgnoreCase(orgId, variant.getSku())) {
            throw new ApiException(409, "Variant SKU already exists");
        }
        variant.setOrganizationId(orgId);
        variant.setProductId(productId);
        if (variant.getCurrency() == null || variant.getCurrency().isBlank()) {
            variant.setCurrency("EUR");
        }
        if (variant.getStatus() == null || variant.getStatus().isBlank()) {
            variant.setStatus("ACTIVE");
        }
        return variantRepository.save(variant);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
