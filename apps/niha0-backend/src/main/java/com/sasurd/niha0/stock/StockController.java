package com.sasurd.niha0.stock;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/items")
    public List<StockItem> listItems() {
        return stockService.listItems();
    }

    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','OPS')")
    public StockItem createItem(@RequestBody StockItem item) {
        return stockService.createItem(item);
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','OPS')")
    public StockItem updateItem(@PathVariable UUID id, @RequestBody StockItem item) {
        return stockService.updateItem(id, item);
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public void deleteItem(@PathVariable UUID id) {
        stockService.deleteItem(id);
    }

    @PostMapping("/items/{id}/adjust")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','OPS')")
    public StockItem adjust(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return stockService.adjust(id, body);
    }

    @GetMapping("/movements")
    public List<StockMovement> listMovements() {
        return stockService.listMovements();
    }
}
