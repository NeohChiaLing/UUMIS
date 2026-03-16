package com.uumis.repository;

import com.uumis.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// CHANGE <User, Long> TO <User, Integer>
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailOrUsername(String email, String username);
    Optional<User> findByUsernameOrEmail(String username, String email);
}