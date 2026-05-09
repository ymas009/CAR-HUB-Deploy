package com.carhub.security;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {
}
