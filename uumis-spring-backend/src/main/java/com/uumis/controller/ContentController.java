package com.uumis.controller;

import com.uumis.entity.PageContent;
import com.uumis.repository.PageContentRepository;
import com.uumis.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/content")
@CrossOrigin(origins = "http://localhost:4200")
public class ContentController {

    @Autowired
    private PageContentRepository contentRepository;

    // GET: Fetch content for ANY page
    @GetMapping("/{pageId}")
    public ResponseEntity<String> getPage(@PathVariable String pageId) {
        return contentRepository.findById(pageId)
                .map(content -> ResponseEntity.ok(content.getJsonData()))
                .orElse(ResponseEntity.ok("{}")); // Return empty JSON if not found
    }

    // Update this method in your ContentController.java
    @PostMapping("/{pageId}")
    public ResponseEntity<String> savePageContent(@PathVariable String pageId, @RequestBody String jsonData) {
        try {
            // Log it to your IntelliJ/Eclipse console to see if data is actually arriving
            System.out.println("Received data for: " + pageId);
            System.out.println("Data content: " + jsonData);

            PageContent pageContent = new PageContent(pageId, jsonData);
            contentRepository.save(pageContent);

            return ResponseEntity.ok("Content saved to database!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
    // DELETE: Reset a page to defaults (removes from DB)
    @DeleteMapping("/{pageId}")
    public ResponseEntity<String> deletePage(@PathVariable String pageId) {
        if (contentRepository.existsById(pageId)) {
            contentRepository.deleteById(pageId);
            return ResponseEntity.ok("Page " + pageId + " reset to defaults.");
        }
        return ResponseEntity.notFound().build();
    }

    // Add these to your existing ContentController.java

    @Autowired
    private EmailService emailService; // Inject your existing EmailService

    @PostMapping("/contact/send-email")
    public ResponseEntity<String> sendInquiry(@RequestBody Map<String, String> details) {
        String fullName = details.get("fullName");
        String contactNum = details.get("contactNum");
        String email = details.get("email");
        String message = details.get("message");

        String subject = "New Website Inquiry from " + fullName;
        String body = "You have received a new message:\n\n" +
                "Name: " + fullName + "\n" +
                "Contact: " + contactNum + "\n" +
                "Email: " + email + "\n" +
                "Message: " + message;

        // Send to the school email
        emailService.sendEmail("uumis@uum.edu.my", subject, body);

        return ResponseEntity.ok("Email sent successfully!");
    }
}