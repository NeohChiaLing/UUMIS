package com.uumis.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "subjects")
public class Subject {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    private String code;
    private String category;
    private Boolean active;
    private String icon;

    // --- NEW FIELDS FOR ASSIGNMENT LINKING ---
    private String level;     // e.g., "Kindergarten", "Primary"
    private String yearGroup; // e.g., "Year 1", "Year 5"

    // Getters and Setters...
    public String getLevel() { return level; } public void setLevel(String level) { this.level = level; }
    public String getYearGroup() { return yearGroup; } public void setYearGroup(String yearGroup) { this.yearGroup = yearGroup; }
    // Getters and Setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getCode() { return code; } public void setCode(String code) { this.code = code; }
    public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
    public Boolean getActive() { return active; } public void setActive(Boolean active) { this.active = active; }
    public String getIcon() { return icon; } public void setIcon(String icon) { this.icon = icon; }
}