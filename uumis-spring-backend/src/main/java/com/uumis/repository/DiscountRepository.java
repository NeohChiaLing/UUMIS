package com.uumis.repository;
 // Change to your actual package

import com.uumis.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiscountRepository extends JpaRepository<Discount, Integer> {
    List<Discount> findAllByOrderByIdDesc();
    List<Discount> findByIsActiveTrueOrderByIdDesc(); // Used by Parents
}