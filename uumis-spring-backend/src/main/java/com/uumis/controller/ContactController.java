package com.uumis.controller;

import com.uumis.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
// FIX: Changed this URL so it doesn't conflict with your Contact Us page!
@RequestMapping("/api/admin/email")
@CrossOrigin(origins = "http://localhost:4200")
public class ContactController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-rejection")
    public String sendEmail(@RequestBody Map<String, String> payload) {
        String studentName = payload.get("fullName");
        String studentEmail = payload.get("email");
        String messageBody = payload.get("message");

        // Format the email subject and body
        String subject = "UUMIS Profile Update: Action Required";
        String formattedBody = "Dear " + studentName + ",\n\n"
                + messageBody + "\n\n"
                + "Best Regards,\nUUMIS Administration";

        // Send the email to the student
        emailService.sendEmail(studentEmail, subject, formattedBody);

        return "Email sent successfully!";
    }
}