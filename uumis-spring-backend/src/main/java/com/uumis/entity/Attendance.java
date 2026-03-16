package com.uumis.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "attendance")
public class Attendance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    private String studentId; // e.g., Username or ID
    private String studentName;
    private String yearGroup;
    private String date; // The specific day (YYYY-MM-DD)
    private String timeIn;
    private String status; // Present, Absent, Late

    private String mcFile;
    @Lob @Column(columnDefinition = "LONGTEXT") private String mcUrl; // Stores the Base64 PDF/Image

    // Getters & Setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getStudentId() { return studentId; } public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getYearGroup() { return yearGroup; } public void setYearGroup(String yearGroup) { this.yearGroup = yearGroup; }
    public String getDate() { return date; } public void setDate(String date) { this.date = date; }
    public String getTimeIn() { return timeIn; } public void setTimeIn(String timeIn) { this.timeIn = timeIn; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getMcFile() { return mcFile; } public void setMcFile(String mcFile) { this.mcFile = mcFile; }
    public String getMcUrl() { return mcUrl; } public void setMcUrl(String mcUrl) { this.mcUrl = mcUrl; }
}