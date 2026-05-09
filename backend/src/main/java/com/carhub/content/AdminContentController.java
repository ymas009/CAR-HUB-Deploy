package com.carhub.content;

import com.carhub.content.dto.ContentPageResponse;
import com.carhub.content.dto.ContentPageUpdateRequest;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/content")
public class AdminContentController {
    private final ContentPageService contentPageService;
    private final CurrentUser currentUser;

    public AdminContentController(ContentPageService contentPageService, CurrentUser currentUser) {
        this.contentPageService = contentPageService;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<ContentPageResponse> list() {
        return contentPageService.adminPages();
    }

    @PutMapping("/{slug}")
    ContentPageResponse update(@PathVariable String slug, @Valid @RequestBody ContentPageUpdateRequest request) {
        return contentPageService.update(currentUser.require().id(), slug, request);
    }
}
