package com.sasurd.niha0.identity.dto;

import java.util.List;

public record OAuth2StatusResponse(boolean enabled, List<String> providers) {
}
