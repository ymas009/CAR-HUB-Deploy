package com.carhub.feedback;

import com.carhub.feedback.dto.FeedbackResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
public class PublicFeedbackController {
    private final FeedbackService feedbackService;

    public PublicFeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping("/approved")
    List<FeedbackResponse> approved() {
        return feedbackService.approved();
    }
}
