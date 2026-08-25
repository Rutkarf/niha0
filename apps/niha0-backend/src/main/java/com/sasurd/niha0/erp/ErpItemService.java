package com.sasurd.niha0.erp;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ErpItemService {

    private final ErpItemRepository repository;

    public ErpItemService(ErpItemRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ErpItem> list(ErpModule module) {
        return repository.findByOrganizationIdAndModuleOrderByUpdatedAtDesc(orgId(), module);
    }

    @Transactional(readOnly = true)
    public ErpItem get(ErpModule module, UUID id) {
        return repository.findByIdAndOrganizationIdAndModule(id, orgId(), module)
                .orElseThrow(() -> new ApiException(404, module + " item not found"));
    }

    @Transactional
    public ErpItem create(ErpModule module, ErpItem item) {
        UUID orgId = orgId();
        if (item.getCode() == null || item.getCode().isBlank()) {
            throw new ApiException(400, "code is required");
        }
        if (item.getTitle() == null || item.getTitle().isBlank()) {
            throw new ApiException(400, "title is required");
        }
        if (repository.existsByOrganizationIdAndModuleAndCodeIgnoreCase(orgId, module, item.getCode())) {
            throw new ApiException(409, "code already exists");
        }
        item.setOrganizationId(orgId);
        item.setModule(module);
        if (item.getStatus() == null || item.getStatus().isBlank()) {
            item.setStatus("DRAFT");
        }
        return repository.save(item);
    }

    @Transactional
    public ErpItem update(ErpModule module, UUID id, ErpItem update) {
        ErpItem existing = get(module, id);
        if (update.getTitle() != null) {
            existing.setTitle(update.getTitle());
        }
        if (update.getStatus() != null) {
            existing.setStatus(update.getStatus());
        }
        if (update.getDetailsJson() != null) {
            existing.setDetailsJson(update.getDetailsJson());
        }
        if (update.getCode() != null && !update.getCode().equalsIgnoreCase(existing.getCode())) {
            if (repository.existsByOrganizationIdAndModuleAndCodeIgnoreCase(orgId(), module, update.getCode())) {
                throw new ApiException(409, "code already exists");
            }
            existing.setCode(update.getCode());
        }
        return repository.save(existing);
    }

    @Transactional
    public void delete(ErpModule module, UUID id) {
        repository.delete(get(module, id));
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
