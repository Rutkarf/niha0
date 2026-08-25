package com.sasurd.niha0.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.sasurd.niha0.stock.StockItem;
import com.sasurd.niha0.stock.StockService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Real stock execution — creates a replenishment movement on approved STOCK_ALERT.
 */
@Primary
@Component
public class StockModuleActionBridge extends StockActionBridge {

    private final StockService stockService;

    public StockModuleActionBridge(StockService stockService,
                                   com.sasurd.niha0.crm.TaskRepository taskRepository) {
        super(taskRepository);
        this.stockService = stockService;
    }

    @Override
    public ActionExecutionResult applyStockAlert(UUID orgId, AgentAction action, JsonNode payload) {
        String sku = payload != null && payload.has("sku") ? payload.get("sku").asText("SKU-42") : "SKU-42";
        int qty = payload != null && payload.has("qty") ? payload.get("qty").asInt(50) : 50;
        try {
            StockItem item = stockService.replenishBySku(sku, qty, action.getDescription());
            return ActionExecutionResult.ok("Réapprovisionnement stock exécuté", Map.of(
                    "stockItemId", item.getId().toString(),
                    "sku", item.getSku(),
                    "quantity", item.getQuantity(),
                    "added", qty));
        } catch (Exception e) {
            return super.applyStockAlert(orgId, action, payload);
        }
    }
}
