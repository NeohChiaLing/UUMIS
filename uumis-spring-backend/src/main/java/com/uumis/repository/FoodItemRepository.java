package com.uumis.repository;
import com.uumis.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {}