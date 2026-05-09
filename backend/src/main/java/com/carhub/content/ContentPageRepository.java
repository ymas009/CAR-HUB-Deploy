package com.carhub.content;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContentPageRepository extends JpaRepository<ContentPage, UUID> {
    Optional<ContentPage> findBySlug(String slug);
    Optional<ContentPage> findBySlugAndPublishedTrue(String slug);
    boolean existsBySlug(String slug);
    List<ContentPage> findAllByOrderBySlugAsc();
}
