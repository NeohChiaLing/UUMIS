package com.uumis.repository;
import com.uumis.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {}