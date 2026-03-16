package com.uumis.controller;

import com.uumis.entity.FoodItem;
import com.uumis.entity.FoodOrder;
import com.uumis.repository.FoodItemRepository;
import com.uumis.repository.FoodOrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/food")
@CrossOrigin("*")
public class FoodController {

    @Autowired private FoodItemRepository itemRepo;
    @Autowired private FoodOrderRepository orderRepo;

    // --- MENU APIs ---
    @GetMapping("/items")
    public List<FoodItem> getMenu() { return itemRepo.findAll(); }

    @PostMapping("/items")
    @Transactional
    public ResponseEntity<?> saveMenu(@RequestBody List<FoodItem> items) {
        itemRepo.deleteAll(); // Clears old menu
        List<FoodItem> saved = itemRepo.saveAll(items); // Saves new menu
        return ResponseEntity.ok(Map.of("message", "Menu updated successfully!"));
    }

    // --- ORDER APIs ---
    @GetMapping("/orders")
    public List<FoodOrder> getOrders() { return orderRepo.findAll(); }

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(@RequestBody FoodOrder order) {
        order.setStatus("PENDING");
        FoodOrder saved = orderRepo.save(order);
        return ResponseEntity.ok(Map.of("message", "Order placed successfully!"));
    }

    @PutMapping("/orders/{id}/complete")
    public ResponseEntity<?> completeOrder(@PathVariable Long id) {
        return orderRepo.findById(id).map(order -> {
            order.setStatus("COMPLETED");
            orderRepo.save(order);
            return ResponseEntity.ok(Map.of("message", "Order marked as completed!"));
        }).orElse(ResponseEntity.notFound().build());
    }
}