package com.sasurd.niha0.erp;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/erp/{module}")
@PreAuthorize("isAuthenticated()")
public class ErpItemController {

    private final ErpItemService erpItemService;

    public ErpItemController(ErpItemService erpItemService) {
        this.erpItemService = erpItemService;
    }

    @GetMapping("/items")
    public List<ErpItem> list(@PathVariable String module) {
        return erpItemService.list(parse(module));
    }

    @GetMapping("/items/{id}")
    public ErpItem get(@PathVariable String module, @PathVariable UUID id) {
        return erpItemService.get(parse(module), id);
    }

    @PostMapping("/items")
    @PreAuthorize("hasAuthority('erp.write')")
    public ErpItem create(@PathVariable String module, @RequestBody ErpItem body) {
        return erpItemService.create(parse(module), body);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAuthority('erp.write')")
    public ErpItem update(@PathVariable String module, @PathVariable UUID id, @RequestBody ErpItem body) {
        return erpItemService.update(parse(module), id, body);
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAuthority('erp.write')")
    public void delete(@PathVariable String module, @PathVariable UUID id) {
        erpItemService.delete(parse(module), id);
    }

    private static ErpModule parse(String module) {
        try {
            return ErpModule.fromPath(module);
        } catch (Exception e) {
            throw new com.sasurd.niha0.common.ApiException(400, "Unknown ERP module: " + module);
        }
    }
}
