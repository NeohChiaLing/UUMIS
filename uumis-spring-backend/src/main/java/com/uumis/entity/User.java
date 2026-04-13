package com.uumis.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    // ==========================================
    // --- 1. PRIMARY IDENTITY & AUTH ---
    // ==========================================
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", unique = true)
    private String studentId;

    private String username;
    private String password;
    private String role;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true)
    private String email;

    private String phone;

    // Bio is currently used to store Grade/Year
    private String bio;

    // ==========================================
    // --- 2. SYSTEM STATUS & SETTINGS ---
    // ==========================================
    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Column(name = "language_pref", columnDefinition = "varchar(10) default 'en'")
    private String languagePreference = "en";

    // ==========================================
    // --- 3. MASSIVE DATA FIELDS (JSON / IMAGES) ---
    // ==========================================
    @Lob
    @Column(name = "avatar", columnDefinition = "LONGTEXT")
    private String avatar;

    @Column(name = "profile_status", columnDefinition = "varchar(255) default 'APPROVED'")
    private String profileStatus = "APPROVED";

    @Lob
    @Column(name = "profile_json", columnDefinition = "LONGTEXT")
    private String profileJson;

    @Lob
    @Column(name = "certificates_json", columnDefinition = "LONGTEXT")
    private String certificatesJson;

    @Lob
    @Column(name = "schedule_json", columnDefinition = "LONGTEXT")
    private String scheduleJson;

    // ==========================================
    // --- 4. TEACHER & ACADEMIC FIELDS ---
    // ==========================================
    @Column(name = "assigned_subjects", columnDefinition = "TEXT")
    private String assignedSubjects;

    @Column(columnDefinition = "TEXT") private String summary;
    @Column(columnDefinition = "TEXT") private String hardSkills;
    @Column(columnDefinition = "TEXT") private String softSkills;
    @Column(columnDefinition = "TEXT") private String philosophy;

    // ==========================================
    // --- 5. FINANCIAL & WALLET DATA ---
    // ==========================================
    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double totalPaid = 0.0;

    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double outstandingDue = 0.0;

    @Column(name = "wallet_balance")
    private Double walletBalance = 0.0;

    // ==========================================
    // --- 6. PARENT-CHILD LINKING ---
    // ==========================================
    @Column(name = "parent_id")
    private Integer parentId;

    @Column(name = "child_user_id")
    private Integer childUserId;


    // ==========================================
    // --- GETTERS & SETTERS ---
    // ==========================================

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

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

    public String getLanguagePreference() { return languagePreference; }
    public void setLanguagePreference(String languagePreference) { this.languagePreference = languagePreference; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getProfileStatus() { return profileStatus; }
    public void setProfileStatus(String profileStatus) { this.profileStatus = profileStatus; }

    public String getProfileJson() { return profileJson; }
    public void setProfileJson(String profileJson) { this.profileJson = profileJson; }

    public String getCertificatesJson() { return certificatesJson; }
    public void setCertificatesJson(String certificatesJson) { this.certificatesJson = certificatesJson; }

    public String getScheduleJson() { return scheduleJson; }
    public void setScheduleJson(String scheduleJson) { this.scheduleJson = scheduleJson; }

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

    public Double getTotalPaid() { return totalPaid; }
    public void setTotalPaid(Double totalPaid) { this.totalPaid = totalPaid; }

    public Double getOutstandingDue() { return outstandingDue; }
    public void setOutstandingDue(Double outstandingDue) { this.outstandingDue = outstandingDue; }

    public Double getWalletBalance() { return walletBalance; }
    public void setWalletBalance(Double walletBalance) { this.walletBalance = walletBalance; }

    public Integer getParentId() { return parentId; }
    public void setParentId(Integer parentId) { this.parentId = parentId; }

    public Integer getChildUserId() { return childUserId; }
    public void setChildUserId(Integer childUserId) { this.childUserId = childUserId; }
}