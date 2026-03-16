package com.uumis.controller;

import com.uumis.entity.Payment;
import com.uumis.repository.PaymentRepository;
import com.uumis.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. GET ALL PAYMENTS FOR A STUDENT
    @GetMapping("/student/{studentId}")
    public List<Payment> getStudentPayments(@PathVariable Integer studentId) {
        return paymentRepository.findByStudentIdOrderByIdDesc(studentId);
    }

    // 2. CREATE NEW PAYMENT
    @PostMapping("/student/{studentId}")
    public ResponseEntity<?> addPayment(@PathVariable Integer studentId, @RequestBody Payment payment) {
        payment.setStudentId(studentId);
        if (payment.getStatus() == null) payment.setStatus("Pending");

        Payment savedPayment = paymentRepository.save(payment);

        // WE REMOVED THE AUTO-UPDATE MATH FROM HERE!
        // Math should only happen when the Financial Manager clicks "Approve" on the frontend.

        return ResponseEntity.ok(savedPayment);
    }

    // 3. UPDATE PAYMENT STATUS OR RECEIPT
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable Integer id, @RequestBody Payment paymentDetails) {
        return paymentRepository.findById(id).map(payment -> {
            if (paymentDetails.getStatus() != null) payment.setStatus(paymentDetails.getStatus());
            if (paymentDetails.getReceiptFile() != null) payment.setReceiptFile(paymentDetails.getReceiptFile());
            if (paymentDetails.getFileUrl() != null) payment.setFileUrl(paymentDetails.getFileUrl());

            return ResponseEntity.ok(paymentRepository.save(payment));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 4. DELETE PAYMENT
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Integer id) {
        return paymentRepository.findById(id).map(payment -> {
            paymentRepository.delete(payment);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- ADD THIS FOR THE ADMIN DASHBOARD ---
    @GetMapping("/all")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentRepository.findAll());
    }
}