package com.carhub.content;

import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.content.dto.ContentPageResponse;
import com.carhub.content.dto.ContentPageUpdateRequest;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ContentPageService {
    private final ContentPageRepository contentPageRepository;
    private final AppUserRepository appUserRepository;
    private final AuditService auditService;

    public ContentPageService(ContentPageRepository contentPageRepository, AppUserRepository appUserRepository,
                              AuditService auditService) {
        this.contentPageRepository = contentPageRepository;
        this.appUserRepository = appUserRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public ContentPageResponse publicPage(String slug) {
        return contentPageRepository.findBySlugAndPublishedTrue(slug)
                .map(this::toResponse)
                .orElseThrow(() -> new BusinessRuleException("CONTENT_NOT_FOUND", "Content page is not available."));
    }

    @Transactional(readOnly = true)
    public List<ContentPageResponse> adminPages() {
        return contentPageRepository.findAllByOrderBySlugAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ContentPageResponse update(UUID adminId, String slug, ContentPageUpdateRequest request) {
        ContentPage page = contentPageRepository.findBySlug(slug)
                .orElseThrow(() -> new BusinessRuleException("CONTENT_NOT_FOUND", "Content page not found."));
        AppUser admin = appUserRepository.findById(adminId)
                .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Admin user not found."));
        String previous = page.isPublished() ? "PUBLISHED" : "DRAFT";
        page.setTitle(request.title().trim());
        page.setSummary(request.summary().trim());
        page.setBody(request.body().trim());
        page.setContactEmail(blankToNull(request.contactEmail()));
        page.setContactPhone(blankToNull(request.contactPhone()));
        page.setSupportHours(blankToNull(request.supportHours()));
        page.setPublished(request.published());
        page.setUpdatedBy(admin);
        page.touch();
        ContentPage saved = contentPageRepository.save(page);
        auditService.recordContentAction(adminId, "ADMIN", "CONTENT_PAGE_UPDATED", saved.getId(),
                previous, saved.isPublished() ? "PUBLISHED" : "DRAFT", "Admin updated " + slug + " content.");
        return toResponse(saved);
    }

    public ContentPageResponse toResponse(ContentPage page) {
        return new ContentPageResponse(page.getId(), page.getSlug(), page.getTitle(), page.getSummary(),
                page.getBody(), page.getContactEmail(), page.getContactPhone(), page.getSupportHours(),
                page.isPublished(), page.getUpdatedAt());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
