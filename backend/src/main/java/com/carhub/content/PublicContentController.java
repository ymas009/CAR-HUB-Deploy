package com.carhub.content;

import com.carhub.content.dto.ContentPageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/content")
public class PublicContentController {
    private final ContentPageService contentPageService;

    public PublicContentController(ContentPageService contentPageService) {
        this.contentPageService = contentPageService;
    }

    @GetMapping("/{slug}")
    ContentPageResponse page(@PathVariable String slug) {
        return contentPageService.publicPage(slug);
    }
}
