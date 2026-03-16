package com.uumis.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // --- YOUR ORIGINAL METHOD (Kept exactly as you had it) ---
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("your_email@gmail.com"); // Make sure this matches your application.properties email!
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    // --- NEW METHOD FOR MULTIPLE ATTACHMENTS ---
    public void sendEmailWithAttachments(String to, String subject, String body,
                                         String docName, String docData,
                                         String imageName, String imageData) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("your_email@gmail.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            // 1. Attach Document (if exists)
            if (docName != null && docData != null && !docData.isEmpty()) {
                byte[] decodedDoc = Base64.getDecoder().decode(docData);
                ByteArrayResource docResource = new ByteArrayResource(decodedDoc) {
                    @Override public String getFilename() { return docName; }
                };
                helper.addAttachment(docName, docResource);
            }

            // 2. Attach Image (if exists)
            if (imageName != null && imageData != null && !imageData.isEmpty()) {
                byte[] decodedImage = Base64.getDecoder().decode(imageData);
                ByteArrayResource imgResource = new ByteArrayResource(decodedImage) {
                    @Override public String getFilename() { return imageName; }
                };
                helper.addAttachment(imageName, imgResource);
            }

            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("Failed to send email with attachments to: " + to);
            e.printStackTrace();
        }
    }
}