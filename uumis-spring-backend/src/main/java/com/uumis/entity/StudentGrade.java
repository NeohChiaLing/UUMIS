package com.uumis.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "student_grades")
public class StudentGrade {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    private String studentUsername;
    private String studentName;
    private String yearGroup;
    private String subject;
    private Integer mark;
    private String gradeLetter;
    private String status;

    // Getters & Setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getStudentUsername() { return studentUsername; } public void setStudentUsername(String studentUsername) { this.studentUsername = studentUsername; }
    public String getStudentName() { return studentName; } public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getYearGroup() { return yearGroup; } public void setYearGroup(String yearGroup) { this.yearGroup = yearGroup; }
    public String getSubject() { return subject; } public void setSubject(String subject) { this.subject = subject; }
    public Integer getMark() { return mark; } public void setMark(Integer mark) { this.mark = mark; }
    public String getGradeLetter() { return gradeLetter; } public void setGradeLetter(String gradeLetter) { this.gradeLetter = gradeLetter; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
}