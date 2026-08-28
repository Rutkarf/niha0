package com.sasurd.niha0.office.dto;

import java.util.List;

public record OfficeLayoutDto(
        List<RowLayoutDto> rows,
        int rowCount,
        int agentCount,
        int chiefCount
) {}
