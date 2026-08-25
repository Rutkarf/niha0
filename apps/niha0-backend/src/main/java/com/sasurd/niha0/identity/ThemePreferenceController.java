package com.sasurd.niha0.identity;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/theme-preferences")
public class ThemePreferenceController {

    private final ThemePreferenceService service;

    public ThemePreferenceController(ThemePreferenceService service) {
        this.service = service;
    }

    @GetMapping
    public ThemePreferenceService.ThemePreferenceResponse get() {
        return service.get();
    }

    @PutMapping
    public ThemePreferenceService.ThemePreferenceResponse put(
            @Valid @RequestBody ThemePreferenceService.ThemePreferenceRequest request) {
        return service.update(request);
    }
}
