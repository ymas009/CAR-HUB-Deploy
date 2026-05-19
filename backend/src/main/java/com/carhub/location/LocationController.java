package com.carhub.location;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/location")
public class LocationController {
    private final ReverseGeocodeService reverseGeocodeService;

    public LocationController(ReverseGeocodeService reverseGeocodeService) {
        this.reverseGeocodeService = reverseGeocodeService;
    }

    @GetMapping("/reverse")
    ReverseGeocodeResponse reverse(@RequestParam @NotBlank String latitude,
                                   @RequestParam @NotBlank String longitude) {
        return reverseGeocodeService.reverse(latitude, longitude);
    }
}
