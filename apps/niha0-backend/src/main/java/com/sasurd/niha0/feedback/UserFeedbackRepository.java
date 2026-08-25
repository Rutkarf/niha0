package com.sasurd.niha0.feedback;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserFeedbackRepository extends JpaRepository<UserFeedback, UUID> {
}
