package com.uumis.entity; // Change to your actual package

import jakarta.persistence.*;

@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    private String id; // We will use your AS-xxxx string format directly as the Primary Key!

    private String name;
    private String category;
    private Integer quantity;
    private Double value;
    private String status; // "In Stock", "Low Stock", "Out of Stock"
    private String personInCharge;
    private String picInitials;
    private String icon;
    private String color;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPersonInCharge() { return personInCharge; }
    public void setPersonInCharge(String personInCharge) { this.personInCharge = personInCharge; }

    public String getPicInitials() { return picInitials; }
    public void setPicInitials(String picInitials) { this.picInitials = picInitials; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}