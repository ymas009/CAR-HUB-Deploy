package com.carhub.feedback;

import com.carhub.feedback.dto.FeedbackRequest;
import com.carhub.feedback.dto.FeedbackResponse;
import com.carhub.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/feedback")
public class FeedbackController {
    private final FeedbackService feedbackService;
    private final CurrentUser currentUser;

    public FeedbackController(FeedbackService feedbackService, CurrentUser currentUser) {
        this.feedbackService = feedbackService;
        this.currentUser = currentUser;
    }

    @PostMapping
    FeedbackResponse create(@Valid @RequestBody FeedbackRequest request) {
        return feedbackService.create(currentUser.require().id(), request);
    }
}
