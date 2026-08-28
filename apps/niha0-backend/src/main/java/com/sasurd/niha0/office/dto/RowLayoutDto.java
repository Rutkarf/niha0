package com.sasurd.niha0.office.dto;

import java.util.List;

public record RowLayoutDto(
        int rowId,
        String color,
        String role,
        String chiefTitle,
        List<AgentPositionDto> agents,
        ChiefPositionDto chief
) {}
