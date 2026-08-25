package com.sasurd.niha0.stock;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class StockService {

    private final StockItemRepository itemRepository;
    private final StockMovementRepository movementRepository;

    public StockService(StockItemRepository itemRepository, StockMovementRepository movementRepository) {
        this.itemRepository = itemRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional(readOnly = true)
    public List<StockItem> listItems() {
        return itemRepository.findByOrganizationIdOrderBySkuAsc(orgId());
    }

    @Transactional
    public StockItem createItem(StockItem item) {
        UUID org = orgId();
        itemRepository.findByOrganizationIdAndSkuIgnoreCase(org, item.getSku())
                .ifPresent(existing -> {
                    throw new ApiException(409, "SKU already exists");
                });
        item.setOrganizationId(org);
        if (item.getStatus() == null || item.getStatus().isBlank()) item.setStatus("ACTIVE");
        if (item.getUnit() == null || item.getUnit().isBlank()) item.setUnit("unit");
        return itemRepository.save(item);
    }

    @Transactional
    public StockItem updateItem(UUID id, StockItem update) {
        StockItem existing = itemRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Stock item not found"));
        if (update.getName() != null) existing.setName(update.getName());
        if (update.getReorderLevel() >= 0) existing.setReorderLevel(update.getReorderLevel());
        if (update.getUnit() != null) existing.setUnit(update.getUnit());
        if (update.getLocation() != null) existing.setLocation(update.getLocation());
        if (update.getStatus() != null) existing.setStatus(update.getStatus());
        return itemRepository.save(existing);
    }

    @Transactional
    public void deleteItem(UUID id) {
        StockItem existing = itemRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Stock item not found"));
        itemRepository.delete(existing);
    }

    @Transactional
    public StockItem adjust(UUID id, Map<String, Object> body) {
        StockItem item = itemRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Stock item not found"));
        String type = String.valueOf(body.getOrDefault("movementType", "ADJUST")).toUpperCase();
        int qty = body.get("quantity") instanceof Number n ? n.intValue() : 0;
        if (qty == 0) throw new ApiException(400, "quantity must be non-zero");

        int delta = switch (type) {
            case "IN", "PURCHASE", "RECEIVE" -> Math.abs(qty);
            case "OUT", "SHIP", "CONSUME" -> -Math.abs(qty);
            case "ADJUST" -> qty;
            default -> throw new ApiException(400, "Invalid movementType");
        };
        int next = item.getQuantity() + delta;
        if (next < 0) throw new ApiException(400, "Insufficient stock");
        item.setQuantity(next);
        itemRepository.save(item);

        StockMovement movement = new StockMovement();
        movement.setOrganizationId(orgId());
        movement.setStockItemId(item.getId());
        movement.setMovementType(type);
        movement.setQuantity(delta);
        movement.setNote(body.get("note") == null ? null : String.valueOf(body.get("note")));
        movement.setCreatedBy(SecurityUtils.currentUserId());
        movementRepository.save(movement);
        return item;
    }

    @Transactional(readOnly = true)
    public List<StockMovement> listMovements() {
        return movementRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public StockItem replenishBySku(String sku, int qty, String note) {
        UUID org = orgId();
        StockItem item = itemRepository.findByOrganizationIdAndSkuIgnoreCase(org, sku)
                .orElseThrow(() -> new ApiException(404, "SKU not found: " + sku));
        return adjust(item.getId(), Map.of(
                "movementType", "PURCHASE",
                "quantity", Math.max(1, qty),
                "note", note == null ? "Réappro agent IA" : note));
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
