package com.sasurd.niha0.office;

import com.sasurd.niha0.office.dto.ChiefConfigDto;
import com.sasurd.niha0.office.dto.OfficeLayoutDto;
import com.sasurd.niha0.office.dto.RowLayoutDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints additifs pour la grille 10×5 agents + 10 chefs.
 * Ne modifie pas {@link com.sasurd.niha0.agents.AgentController}.
 */
@RestController
@RequestMapping("/nihao/office")
@PreAuthorize("isAuthenticated()")
public class OfficeLayoutController {

    private final OfficeLayoutService officeLayoutService;

    public OfficeLayoutController(OfficeLayoutService officeLayoutService) {
        this.officeLayoutService = officeLayoutService;
    }

    @GetMapping("/layout")
    public OfficeLayoutDto layout() {
        return officeLayoutService.layout();
    }

    @GetMapping("/rows")
    public List<RowLayoutDto> rows() {
        return officeLayoutService.rows();
    }

    @GetMapping("/chiefs")
    public List<ChiefConfigDto> chiefs() {
        return officeLayoutService.chiefs();
    }
}
