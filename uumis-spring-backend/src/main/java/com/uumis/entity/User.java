package com.uumis.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String username;
    private String password;
    private String role;

    @Column(name = "full_name")
    private String fullName;

    // --- THIS IS THE FIX FOR THE DUPLICATE USERS ---
    @Column(unique = true)
    private String email;

    private String phone;
    private String bio;

    // --- NEW FIELDS FOR VERIFICATION ---
    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "is_enabled")
    private Boolean isEnabled = true; // Default true for now to avoid locking old users

    @Lob
    @Column(name = "avatar", columnDefinition = "LONGTEXT")
    private String avatar;

    // --- ADD THIS NEW FIELD ---
    @Column(name = "student_id", unique = true) // Optional: make it unique if needed
    private String studentId;

    @Column(name = "assigned_subjects", columnDefinition = "TEXT")
    private String assignedSubjects;

    // --- TEACHER VARIABLES ---
    @Column(columnDefinition = "TEXT") private String summary;
    @Column(columnDefinition = "TEXT") private String hardSkills;
    @Column(columnDefinition = "TEXT") private String softSkills;
    @Column(columnDefinition = "TEXT") private String philosophy;

    @Column(columnDefinition = "TEXT") private String scheduleJson;

    @Lob @Column(columnDefinition = "LONGTEXT") private String certificatesJson;

    // ==========================================
    // --- NEW: FINANCIAL DATA VARIABLES ---
    // ==========================================
    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double totalPaid = 0.0;

    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double outstandingDue = 0.0;


    // ==========================================
    // --- GETTERS & SETTERS ---
    // ==========================================

    // CHANGE GETTER/SETTER TO Integer
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getVerificationCode() { return verificationCode; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }

    public Boolean isEnabled() { return isEnabled; }
    public void setEnabled(Boolean enabled) { isEnabled = enabled; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getAssignedSubjects() { return assignedSubjects; }
    public void setAssignedSubjects(String assignedSubjects) { this.assignedSubjects = assignedSubjects; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getHardSkills() { return hardSkills; }
    public void setHardSkills(String hardSkills) { this.hardSkills = hardSkills; }

    public String getSoftSkills() { return softSkills; }
    public void setSoftSkills(String softSkills) { this.softSkills = softSkills; }

    public String getPhilosophy() { return philosophy; }
    public void setPhilosophy(String philosophy) { this.philosophy = philosophy; }

    public String getScheduleJson() { return scheduleJson; }
    public void setScheduleJson(String scheduleJson) { this.scheduleJson = scheduleJson; }

    public String getCertificatesJson() { return certificatesJson; }
    public void setCertificatesJson(String certificatesJson) { this.certificatesJson = certificatesJson; }

    // --- FINANCIAL GETTERS & SETTERS ---
    public Double getTotalPaid() { return totalPaid; }
    public void setTotalPaid(Double totalPaid) { this.totalPaid = totalPaid; }

    public Double getOutstandingDue() { return outstandingDue; }
    public void setOutstandingDue(Double outstandingDue) { this.outstandingDue = outstandingDue; }

    // ==========================================
    // --- NEW: PARENT-CHILD LINKING ---
    // ==========================================
    @Column(name = "child_user_id")
    private Integer childUserId;

    @Column(name = "parent_id")
    private Integer parentId;

    public Integer getParentId() { return parentId; }
    public void setParentId(Integer parentId) { this.parentId = parentId; }

    public Integer getChildUserId() { return childUserId; }
    public void setChildUserId(Integer childUserId) { this.childUserId = childUserId; }

    // ==========================================
    // --- NEW: WALLET BALANCE ---
    // ==========================================
    @Column(name = "wallet_balance")
    private Double walletBalance = 0.0;

    public Double getWalletBalance() {
        return walletBalance;
    }

    public void setWalletBalance(Double walletBalance) {
        this.walletBalance = walletBalance;
    }

    @Column(name = "language_pref", columnDefinition = "varchar(10) default 'en'")
    private String languagePreference = "en";

    public String getLanguagePreference() { return languagePreference; }
    public void setLanguagePreference(String languagePreference) { this.languagePreference = languagePreference; }

    public String getProfileStatus() {
        return profileStatus;
    }

    public void setProfileStatus(String profileStatus) {
        this.profileStatus = profileStatus;
    }

    @Column(name = "profile_status", columnDefinition = "varchar(255) default 'APPROVED'")
    private String profileStatus = "APPROVED";

    public String getProfileJson() {
        return profileJson;
    }

    public void setProfileJson(String profileJson) {
        this.profileJson = profileJson;
    }

    @Column(name = "profile_json", columnDefinition = "LONGTEXT")
    private String profileJson;

}