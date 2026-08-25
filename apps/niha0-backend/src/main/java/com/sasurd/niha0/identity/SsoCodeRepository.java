package com.sasurd.niha0.identity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SsoCodeRepository extends JpaRepository<SsoCode, UUID> {
    Optional<SsoCode> findByIdAndConsumedAtIsNull(UUID id);
}
