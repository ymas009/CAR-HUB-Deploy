package com.carhub.user;

import com.carhub.security.CurrentUser;
import com.carhub.user.dto.CustomerProfileRequest;
import com.carhub.user.dto.CustomerProfileResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/profile")
public class CustomerProfileController {
    private final CustomerProfileService customerProfileService;
    private final CurrentUser currentUser;

    public CustomerProfileController(CustomerProfileService customerProfileService, CurrentUser currentUser) {
        this.customerProfileService = customerProfileService;
        this.currentUser = currentUser;
    }

    @GetMapping
    CustomerProfileResponse get() {
        return customerProfileService.get(currentUser.require().id());
    }

    @PutMapping
    CustomerProfileResponse update(@RequestBody CustomerProfileRequest request) {
        return customerProfileService.update(currentUser.require().id(), request);
    }
}
