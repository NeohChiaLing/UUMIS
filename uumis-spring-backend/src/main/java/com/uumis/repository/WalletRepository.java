package com.uumis.repository;

// Change to your package

import com.uumis.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WalletRepository extends JpaRepository<WalletTransaction, Integer> {
    List<WalletTransaction> findByStudentIdOrderByIdDesc(Integer studentId);
}