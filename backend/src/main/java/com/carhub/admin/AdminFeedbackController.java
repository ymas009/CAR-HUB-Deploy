package com.carhub.admin;

import com.carhub.feedback.FeedbackService;
import com.carhub.feedback.dto.FeedbackModerationRequest;
import com.carhub.feedback.dto.FeedbackResponse;
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
@RequestMapping("/api/v1/admin/feedback")
public class AdminFeedbackController {
    private final FeedbackService feedbackService;
    private final CurrentUser currentUser;

    public AdminFeedbackController(FeedbackService feedbackService, CurrentUser currentUser) {
        this.feedbackService = feedbackService;
        this.currentUser = currentUser;
    }

    @GetMapping
    List<FeedbackResponse> moderationQueue() {
        return feedbackService.all();
    }

    @PutMapping("/{feedbackId}")
    FeedbackResponse moderate(@PathVariable java.util.UUID feedbackId, @Valid @RequestBody FeedbackModerationRequest request) {
        return feedbackService.moderate(currentUser.require().id(), feedbackId, request.moderationStatus());
    }
}
