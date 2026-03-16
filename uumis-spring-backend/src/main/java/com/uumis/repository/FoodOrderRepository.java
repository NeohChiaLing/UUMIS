package com.uumis.repository;
import com.uumis.entity.FoodOrder;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {}