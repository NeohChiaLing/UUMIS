package com.uumis.controller;

import com.uumis.entity.*;
import com.uumis.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired
    private com.uumis.service.EmailService emailService;

    // ADD THIS INSIDE YOUR AuthController.java
    // ADD @CrossOrigin("*") TO ALLOW ANGULAR TO READ IT

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
    // --- 1. DUAL LOGIN (Username OR Email) ---
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String loginId = request.get("username"); // Frontend sends 'username' field
        String password = request.get("password");

        // Check Username OR Email
        Optional<User> userOpt = userRepository.findByUsernameOrEmail(loginId, loginId);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                // Check if verified
                if (!user.isEnabled()) {
                    return ResponseEntity.status(401).body(Map.of("message", "Please check your email to verify your account first."));
                }
                return ResponseEntity.ok(Map.of("message", "Login successful", "user", user));
            }
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

    // --- 2. REGISTER (Send Verification Code) ---
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username taken"));
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }

        // Generate 6-digit code
        String code = String.valueOf((int)(Math.random() * 900000) + 100000);
        user.setVerificationCode(code);
        user.setEnabled(false); // Locked until verified

        userRepository.save(user);

        // Send Email
        emailService.sendEmail(user.getEmail(), "Verify your UUMIS Account",
                "Welcome! Your verification code is: " + code);

        return ResponseEntity.ok(Map.of("message", "Registration successful"));
    }

    // --- 3. VERIFY EMAIL (New API) ---
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().getVerificationCode().equals(code)) {
            User user = userOpt.get();
            user.setEnabled(true);
            user.setVerificationCode(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Verified"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid Code"));
    }

    // --- 4. FORGOT PASSWORD ---
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmailOrUsername(email, email); // Handle both

        if (userOpt.isPresent()) {
            String code = String.valueOf((int)(Math.random() * 900000) + 100000);
            User user = userOpt.get();
            user.setVerificationCode(code);
            userRepository.save(user);

            emailService.sendEmail(user.getEmail(), "Reset Password Code", "Your code is: " + code);
            return ResponseEntity.ok(Map.of("message", "Code sent"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
    }

    // --- 5. RESET PASSWORD ---
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().getVerificationCode().equals(code)) {
            User user = userOpt.get();
            user.setPassword(newPassword);
            user.setVerificationCode(null);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid Code or Email"));
    }

    // --- 7. ADMIN ASSIGN ROLE ---
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {

            if (userDetails.getFullName() != null) user.setFullName(userDetails.getFullName());
            if (userDetails.getPhone() != null) user.setPhone(userDetails.getPhone());
            if (userDetails.getBio() != null) user.setBio(userDetails.getBio());

            // --- NEW: SAVE AVATAR ---
            if (userDetails.getAvatar() != null) {
                user.setAvatar(userDetails.getAvatar());
            }

            // === THE FIX: Moved inside the map block! ===
            if (userDetails.getLanguagePreference() != null) {
                user.setLanguagePreference(userDetails.getLanguagePreference());
            }

            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile updated!", "user", updatedUser));
        }).orElse(ResponseEntity.notFound().build());
    }
    // --- 6. ADMIN DELETE USER (Safe Delete) ---
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) { // ID is Integer
        try {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            // This catches the Foreign Key error if the user has assignments
            return ResponseEntity.status(400).body(Map.of("message", "Cannot delete user. They might have pending assignments or records."));
        }
    }

    // ... inside AuthController ...

    // --- 9. GET ALL STUDENTS (For Admin Dashboard) ---
    @GetMapping("/students")
    public List<User> getAllStudents() {
        // Fetch all users where role is 'student'
        // Note: You might need to add this method to UserRepository if it doesn't exist
        return userRepository.findAll().stream()
                .filter(user -> "student".equalsIgnoreCase(user.getRole()))
                .toList();
    }

    // --- 10. APPROVE STUDENT (Update Status) ---
    @PutMapping("/students/{id}/approve")
    public ResponseEntity<?> approveStudent(@PathVariable Integer id) {
        return userRepository.findById(id).map(user -> {
            user.setEnabled(true); // 'Active' status maps to isEnabled = true
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Student approved successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- 11. ADMIN UPDATE STUDENT DETAILS ---
    @PutMapping("/students/{id}")
    public ResponseEntity<?> adminUpdateStudent(@PathVariable Integer id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {

            // Update standard fields
            if (userDetails.getFullName() != null) user.setFullName(userDetails.getFullName());
            if (userDetails.getPhone() != null) user.setPhone(userDetails.getPhone());
            if (userDetails.getBio() != null) user.setBio(userDetails.getBio()); // Still using Bio for Grade

            if (userDetails.getStudentId() != null) {
                user.setStudentId(userDetails.getStudentId());
            }

            // ==========================================
            // --- NEW: SAVE FINANCIAL BALANCES ---
            // (Used by the Financial Manager in Payment Portal)
            // ==========================================
            if (userDetails.getTotalPaid() != null) user.setTotalPaid(userDetails.getTotalPaid());
            if (userDetails.getOutstandingDue() != null) user.setOutstandingDue(userDetails.getOutstandingDue());

            // ==========================================
            // --- NEW: AUTO-LINKING PARENT TO STUDENT ---
            // (Used by Register Manager in Student Portal)
            // ==========================================
            if (userDetails.getParentId() != null) {
                user.setParentId(userDetails.getParentId());

                // Instantly update the Parent's account to know who their child is!
                userRepository.findById(userDetails.getParentId()).ifPresent(parent -> {
                    parent.setChildUserId(user.getId()); // Sets the student's ID into the Parent
                    userRepository.save(parent);
                });
            }

            User updatedUser = userRepository.save(user);

            // Important: Don't send password or sensitive token back in the response
            updatedUser.setPassword(null);
            updatedUser.setVerificationCode(null);

            return ResponseEntity.ok(Map.of("message", "Student details updated successfully!", "user", updatedUser));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ... inside AuthController.java ...

    // --- 12. GET ALL TEACHERS (For Admin Dashboard) ---
    @GetMapping("/teachers")
    public List<User> getAllTeachers() {
        return userRepository.findAll().stream()
                // FIX: Added .trim() to ignore accidental spaces in the database
                .filter(user -> user.getRole() != null && "teacher".equalsIgnoreCase(user.getRole().trim()))
                .toList();
    }

    // --- 13. ADMIN UPDATE TEACHER SUBJECTS & PROFILE ---
    @PutMapping("/teachers/{id}")
    public ResponseEntity<?> adminUpdateTeacher(@PathVariable Integer id, @RequestBody User teacherDetails) {
        return userRepository.findById(id).map(user -> {

            if (teacherDetails.getFullName() != null) user.setFullName(teacherDetails.getFullName());
            if (teacherDetails.getPhone() != null) user.setPhone(teacherDetails.getPhone());
            if (teacherDetails.getAssignedSubjects() != null) user.setAssignedSubjects(teacherDetails.getAssignedSubjects());

            // --- NEW: Save Profile, Schedule, and Certs ---
            if (teacherDetails.getSummary() != null) user.setSummary(teacherDetails.getSummary());
            if (teacherDetails.getHardSkills() != null) user.setHardSkills(teacherDetails.getHardSkills());
            if (teacherDetails.getSoftSkills() != null) user.setSoftSkills(teacherDetails.getSoftSkills());
            if (teacherDetails.getPhilosophy() != null) user.setPhilosophy(teacherDetails.getPhilosophy());
            if (teacherDetails.getScheduleJson() != null) user.setScheduleJson(teacherDetails.getScheduleJson());
            if (teacherDetails.getCertificatesJson() != null) user.setCertificatesJson(teacherDetails.getCertificatesJson());

            User updatedUser = userRepository.save(user);
            updatedUser.setPassword(null);
            updatedUser.setVerificationCode(null);

            return ResponseEntity.ok(Map.of("message", "Teacher updated successfully!", "user", updatedUser));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/parents")
    public ResponseEntity<?> getAllParents() {
        // Fetches all users and filters out only the parents
        List<User> parents = userRepository.findAll().stream()
                .filter(u -> "parent".equalsIgnoreCase(u.getRole()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(parents);
    }

    // ==========================================
    // --- 14. PARENT PORTAL: FETCH CHILD DATA ---
    // ==========================================
    @GetMapping("/dashboard/student/{studentId}")
    public ResponseEntity<?> getStudentDashboardData(@PathVariable Integer studentId) {
        return userRepository.findById(studentId).map(student -> {

            // For security, remove passwords before sending data to the parent
            student.setPassword(null);
            student.setVerificationCode(null);

            return ResponseEntity.ok(student);
        }).orElse(ResponseEntity.notFound().build());
    }

    @Autowired
    private RefundRepository refundRepository;

    // 1. Parent submits a refund request
    @PostMapping("/refunds/student/{studentId}")
    public ResponseEntity<?> requestRefund(@PathVariable Integer studentId, @RequestBody RefundRequest refund) {
        refund.setStudentId(studentId);
        refund.setStatus("Pending"); // Always pending when parent submits
        return ResponseEntity.ok(refundRepository.save(refund));
    }

    // 2. Fetch refunds for a specific student (Used by Parent and Staff)
    @GetMapping("/refunds/student/{studentId}")
    public ResponseEntity<List<RefundRequest>> getStudentRefunds(@PathVariable Integer studentId) {
        return ResponseEntity.ok(refundRepository.findByStudentIdOrderByIdDesc(studentId));
    }

    // 3. Staff updates refund status (Approve/Reject)
    @PutMapping("/refunds/{id}")
    public ResponseEntity<?> updateRefundStatus(@PathVariable Integer id, @RequestParam String status) {
        return refundRepository.findById(id).map(refund -> {
            refund.setStatus(status);
            return ResponseEntity.ok(refundRepository.save(refund));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Autowired
    private DiscountRepository discountRepository;

    // 1. Staff: Get ALL discounts
    @GetMapping("/discounts")
    public ResponseEntity<List<Discount>> getAllDiscounts() {
        return ResponseEntity.ok(discountRepository.findAllByOrderByIdDesc());
    }

    // 2. Parent: Get ONLY ACTIVE discounts
    @GetMapping("/discounts/active")
    public ResponseEntity<List<Discount>> getActiveDiscounts() {
        return ResponseEntity.ok(discountRepository.findByIsActiveTrueOrderByIdDesc());
    }

    // 3. Staff: Create a new discount
    @PostMapping("/discounts")
    public ResponseEntity<?> createDiscount(@RequestBody Discount discount) {
        return ResponseEntity.ok(discountRepository.save(discount));
    }

    // 4. Staff: Update an existing discount (Including toggle Active status)
    @PutMapping("/discounts/{id}")
    public ResponseEntity<?> updateDiscount(@PathVariable Integer id, @RequestBody Discount updatedData) {
        return discountRepository.findById(id).map(discount -> {
            discount.setTitle(updatedData.getTitle());
            discount.setDescription(updatedData.getDescription());
            discount.setStartDate(updatedData.getStartDate());
            discount.setEndDate(updatedData.getEndDate());
            discount.setIsActive(updatedData.getIsActive());

            if(updatedData.getFileUrl() != null) {
                discount.setFileUrl(updatedData.getFileUrl());
                discount.setFileName(updatedData.getFileName());
                discount.setFileType(updatedData.getFileType());
            }

            return ResponseEntity.ok(discountRepository.save(discount));
        }).orElse(ResponseEntity.notFound().build());
    }
    @Autowired
    private WalletRepository walletRepository;

    // 1. Get Wallet Balance and History
    @GetMapping("/wallet/student/{studentId}")
    public ResponseEntity<?> getWalletData(@PathVariable Integer studentId) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();

        // Ensure wallet isn't null
        Double balance = student.getWalletBalance() != null ? student.getWalletBalance() : 0.0;
        List<WalletTransaction> history = walletRepository.findByStudentIdOrderByIdDesc(studentId);

        return ResponseEntity.ok(java.util.Map.of(
                "balance", balance,
                "transactions", history
        ));
    }

    // 2. Staff Top Up / Deduct OR Parent Food Purchase
    @PostMapping("/wallet/student/{studentId}/transaction")
    public ResponseEntity<?> addWalletTransaction(@PathVariable Integer studentId, @RequestBody WalletTransaction txn) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();

        Double currentBalance = student.getWalletBalance() != null ? student.getWalletBalance() : 0.0;

        // Perform Math
        if (txn.getType().equals("Top Up")) {
            currentBalance += txn.getAmount();
        } else {
            currentBalance -= txn.getAmount();
        }

        // Prevent negative balance
        if (currentBalance < 0) currentBalance = 0.0;

        student.setWalletBalance(currentBalance);
        userRepository.save(student);

        txn.setStudentId(studentId);
        WalletTransaction savedTxn = walletRepository.save(txn);

        // === LOW BALANCE EMAIL ALERT LOGIC ===
        boolean isLowBalance = false;
        if (currentBalance < 20.00) {
            isLowBalance = true;
            System.out.println("ALERT EMAIL SENT TO PARENT: 'Your child's wallet balance is RM " + currentBalance + ". Please transfer funds to the school bank account to top up.'");
            // (In a real app, you trigger your JavaMailSender service here)
        }

        return ResponseEntity.ok(java.util.Map.of(
                "balance", currentBalance,
                "transaction", savedTxn,
                "isLowBalance", isLowBalance
        ));
    }

    @Autowired
    private InventoryRepository inventoryRepository;

    // 1. Get All Inventory Items
    @GetMapping("/inventory")
    public ResponseEntity<?> getAllInventory() {
        return ResponseEntity.ok(inventoryRepository.findAll());
    }

    // 2. Add New Inventory Item
    @PostMapping("/inventory")
    public ResponseEntity<?> createInventory(@RequestBody Inventory inventory) {
        return ResponseEntity.ok(inventoryRepository.save(inventory));
    }

    // 3. Update Existing Inventory Item
    @PutMapping("/inventory/{id}")
    public ResponseEntity<?> updateInventory(@PathVariable String id, @RequestBody Inventory details) {
        return inventoryRepository.findById(id).map(inv -> {
            inv.setName(details.getName());
            inv.setCategory(details.getCategory());
            inv.setQuantity(details.getQuantity());
            inv.setValue(details.getValue());
            inv.setStatus(details.getStatus());
            inv.setPersonInCharge(details.getPersonInCharge());
            inv.setPicInitials(details.getPicInitials());
            inv.setIcon(details.getIcon());
            inv.setColor(details.getColor());
            return ResponseEntity.ok(inventoryRepository.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 4. Delete Inventory Item
    @DeleteMapping("/inventory/{id}")
    public ResponseEntity<?> deleteInventory(@PathVariable String id) {
        inventoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Asset deleted successfully"));
    }

    @Autowired
    private NotificationRepository notificationRepository;

    // 1. Get All Notification History
    @GetMapping("/notifications")
    public ResponseEntity<?> getAllNotifications() {
        return ResponseEntity.ok(notificationRepository.findAllByOrderByIdDesc());
    }

    // ==========================================
    // --- NOTIFICATIONS (WITH REAL EMAILS) ---
    // ==========================================
    @PostMapping("/notifications")
    public ResponseEntity<?> createNotification(@RequestBody NotificationRecord notification) {

        List<User> targetUsers;
        String recipientGroup = notification.getRecipient();

        // 1. Filter users based on the selected recipient group
        if ("School-wide (Everyone)".equals(recipientGroup)) {
            targetUsers = userRepository.findAll();
        } else if ("Parents Only".equals(recipientGroup)) {
            targetUsers = userRepository.findAll().stream().filter(u -> "parent".equalsIgnoreCase(u.getRole())).toList();
        } else if ("Teachers Only".equals(recipientGroup)) {
            targetUsers = userRepository.findAll().stream().filter(u -> "teacher".equalsIgnoreCase(u.getRole())).toList();
        } else if ("Administrative Staff".equals(recipientGroup)) {
            targetUsers = userRepository.findAll().stream().filter(u -> "staff".equalsIgnoreCase(u.getRole()) || "admin".equalsIgnoreCase(u.getRole())).toList();
        } else if ("Students".equals(recipientGroup)) {
            targetUsers = userRepository.findAll().stream().filter(u -> "student".equalsIgnoreCase(u.getRole())).toList();
        } else {
            targetUsers = new java.util.ArrayList<>(); // Empty fallback
        }

        // Loop through the filtered users and send the email
        int sentCount = 0;
        for (User u : targetUsers) {
            if (u.getEmail() != null && !u.getEmail().isEmpty() && u.isEnabled()) {
                try {
                    // Always use the attachment method. If both are null, it will just send a normal email automatically.
                    emailService.sendEmailWithAttachments(
                            u.getEmail(),
                            notification.getSubject(),
                            notification.getPreview(),
                            notification.getDocName(),
                            notification.getDocData(),
                            notification.getImageName(),
                            notification.getImageData()
                    );
                    sentCount++;
                } catch (Exception e) {
                    System.out.println("Failed to send email to: " + u.getEmail());
                }
            }
        }

        // 3. Save the record to the database
        notification.setStatus("Delivered");
        // We can use the 'note' or a custom field to store how many emails were sent,
        // but for now, we just save the record successfully.

        return ResponseEntity.ok(notificationRepository.save(notification));
    }


    // ==========================================
    // --- USER ROLES MANAGEMENT ---
    // ==========================================
    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        String newRole = request.get("role");
        return userRepository.findById(id).map(user -> {
            user.setRole(newRole.toLowerCase()); // e.g., "admin", "teacher", "parent", "student", "staff"
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Role updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- ADD THIS FOR THE ADMIN DASHBOARD ---
    @GetMapping("/refunds/all")
    public ResponseEntity<List<RefundRequest>> getAllRefundRequests() {
        return ResponseEntity.ok(refundRepository.findAll());
    }


}