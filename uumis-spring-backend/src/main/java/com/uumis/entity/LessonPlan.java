package com.uumis.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "lesson_plans")
public class LessonPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String teacher;
    private String teacherId;
    private String subject;
    private String topic;
    private String grade;
    private String status;
    private String avatar;

    @Lob @Column(columnDefinition = "LONGTEXT")
    private String pdfUrl; // Stores the Base64 PDF file

    private String fileName;

    // Getters & Setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getTeacher() { return teacher; } public void setTeacher(String teacher) { this.teacher = teacher; }
    public String getTeacherId() { return teacherId; } public void setTeacherId(String teacherId) { this.teacherId = teacherId; }
    public String getSubject() { return subject; } public void setSubject(String subject) { this.subject = subject; }
    public String getTopic() { return topic; } public void setTopic(String topic) { this.topic = topic; }
    public String getGrade() { return grade; } public void setGrade(String grade) { this.grade = grade; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getAvatar() { return avatar; } public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getPdfUrl() { return pdfUrl; } public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }
    public String getFileName() { return fileName; } public void setFileName(String fileName) { this.fileName = fileName; }
}