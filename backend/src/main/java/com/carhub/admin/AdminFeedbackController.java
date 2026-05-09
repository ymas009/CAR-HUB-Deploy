package com.carhub.admin;

import com.carhub.feedback.FeedbackService;
import com.carhub.feedback.dto.FeedbackResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/feedback")
public class AdminFeedbackController {
    private final FeedbackService feedbackService;

    public AdminFeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    List<FeedbackResponse> moderationQueue() {
        return feedbackService.all();
    }
}
