package com.sasurd.niha0.identity.dto;

public record MfaEnableResponse(String secret, String otpauthUri, boolean enabled) {}
