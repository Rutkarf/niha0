package com.sasurd.niha0.office.dto;

public record ChiefConfigDto(
        int chiefId,
        int rowId,
        String role,
        String chiefTitle,
        String color,
        double x,
        double y,
        double z
) {}
