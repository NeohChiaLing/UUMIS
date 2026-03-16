package com.uumis.entity; // Change to your actual package

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "notifications")
public class NotificationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String preview; // The actual message body

    private String recipient;
    private String category;
    private String date;
    private String time;
    private String status; // "Delivered", "Pending", "Failed"
    private Boolean isUrgent;

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getPreview() { return preview; }
    public void setPreview(String preview) { this.preview = preview; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getIsUrgent() { return isUrgent; }
    public void setIsUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; }

    // --- DOCUMENT ATTACHMENT ---
    private String docName;
    private String docType;
    @Column(columnDefinition = "LONGTEXT")
    private String docData;

    // --- IMAGE ATTACHMENT ---
    private String imageName;
    private String imageType;
    @Column(columnDefinition = "LONGTEXT")
    private String imageData;

    // --- GETTERS & SETTERS ---
    public String getDocName() { return docName; }
    public void setDocName(String docName) { this.docName = docName; }
    public String getDocType() { return docType; }
    public void setDocType(String docType) { this.docType = docType; }
    public String getDocData() { return docData; }
    public void setDocData(String docData) { this.docData = docData; }

    public String getImageName() { return imageName; }
    public void setImageName(String imageName) { this.imageName = imageName; }
    public String getImageType() { return imageType; }
    public void setImageType(String imageType) { this.imageType = imageType; }
    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }
}