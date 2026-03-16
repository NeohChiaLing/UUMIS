package com.uumis.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "level_schedules")
public class LevelSchedule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    @Column(unique = true)
    private String levelName; // e.g., "Kindergarten", "KAFA"

    @Lob @Column(columnDefinition = "LONGTEXT")
    private String headers; // Stores JSON array of time slots

    @Lob @Column(columnDefinition = "LONGTEXT")
    private String gridData; // Stores 2D JSON array of subjects

    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getLevelName() { return levelName; } public void setLevelName(String levelName) { this.levelName = levelName; }
    public String getHeaders() { return headers; } public void setHeaders(String headers) { this.headers = headers; }
    public String getGridData() { return gridData; } public void setGridData(String gridData) { this.gridData = gridData; }
}