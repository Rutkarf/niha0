package com.sasurd.niha0.feedback;

import com.sasurd.niha0.feedback.dto.FeedbackRequest;
import com.sasurd.niha0.feedback.dto.FeedbackResponse;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    private final UserFeedbackRepository feedbackRepository;

    public FeedbackService(UserFeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    @Transactional
    public FeedbackResponse submit(FeedbackRequest request) {
        UserFeedback feedback = new UserFeedback();
        feedback.setOrganizationId(SecurityUtils.currentOrganizationId());
        feedback.setUserId(SecurityUtils.currentUserId());
        feedback.setCategory(request.category().trim());
        feedback.setMessage(request.message().trim());
        UserFeedback saved = feedbackRepository.save(feedback);
        return new FeedbackResponse(saved.getId(), saved.getCategory(), saved.getMessage());
    }
}
