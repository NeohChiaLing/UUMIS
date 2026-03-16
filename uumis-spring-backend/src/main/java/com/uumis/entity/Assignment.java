package com.uumis.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "assignments")
public class Assignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    private String yearGroup; // e.g., "Year 1", "Year 5"
    private String type;      // "Assignment" or "Quiz"
    private String subject;   // Subject Code
    private String topic;
    private String dueDate;

    private String fileName;
    @Lob @Column(columnDefinition = "LONGTEXT") private String fileUrl; // Stores PDF Base64

    private String quizDate;
    private String startTime;
    private String endTime;
    private String durationText;
    private Integer durationHours;
    private Integer durationMinutes;
    private Boolean releaseMarks;

    @Lob @Column(columnDefinition = "LONGTEXT") private String questionsJson; // Stores Quiz Arrays
    private String status;

    // Getters and Setters
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getYearGroup() { return yearGroup; } public void setYearGroup(String yearGroup) { this.yearGroup = yearGroup; }
    public String getType() { return type; } public void setType(String type) { this.type = type; }
    public String getSubject() { return subject; } public void setSubject(String subject) { this.subject = subject; }
    public String getTopic() { return topic; } public void setTopic(String topic) { this.topic = topic; }
    public String getDueDate() { return dueDate; } public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public String getFileName() { return fileName; } public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileUrl() { return fileUrl; } public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getQuizDate() { return quizDate; } public void setQuizDate(String quizDate) { this.quizDate = quizDate; }
    public String getStartTime() { return startTime; } public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; } public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getDurationText() { return durationText; } public void setDurationText(String durationText) { this.durationText = durationText; }
    public Integer getDurationHours() { return durationHours; } public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }
    public Integer getDurationMinutes() { return durationMinutes; } public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Boolean getReleaseMarks() { return releaseMarks; } public void setReleaseMarks(Boolean releaseMarks) { this.releaseMarks = releaseMarks; }
    public String getQuestionsJson() { return questionsJson; } public void setQuestionsJson(String questionsJson) { this.questionsJson = questionsJson; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
}