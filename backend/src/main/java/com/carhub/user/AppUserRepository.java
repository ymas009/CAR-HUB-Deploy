package com.carhub.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmailIgnoreCase(String email);
    Optional<AppUser> findByMobile(String mobile);
    Optional<AppUser> findByGoogleId(String googleId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByMobile(String mobile);
}
