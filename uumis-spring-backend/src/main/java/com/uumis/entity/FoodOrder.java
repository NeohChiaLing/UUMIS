package com.uumis.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "food_orders")
public class FoodOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String studentName;
    private String items; // Comma separated list of ordered items
    private Double totalAmount;
    private String status; // "PENDING" or "COMPLETED"
    private LocalDateTime orderDate = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getItems() { return items; } public void setItems(String items) { this.items = items; }
    public Double getTotalAmount() { return totalAmount; } public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public LocalDateTime getOrderDate() { return orderDate; } public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
}