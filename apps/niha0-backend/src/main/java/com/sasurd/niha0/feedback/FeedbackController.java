package com.sasurd.niha0.feedback;

import com.sasurd.niha0.feedback.dto.FeedbackRequest;
import com.sasurd.niha0.feedback.dto.FeedbackResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public FeedbackResponse submit(@Valid @RequestBody FeedbackRequest request) {
        return feedbackService.submit(request);
    }
}
