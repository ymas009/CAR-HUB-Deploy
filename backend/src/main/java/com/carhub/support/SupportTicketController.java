package com.carhub.support;

import com.carhub.security.CurrentUser;
import com.carhub.support.dto.SupportTicketRequest;
import com.carhub.support.dto.SupportTicketResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/support")
public class SupportTicketController {
    private final SupportTicketService supportTicketService;
    private final CurrentUser currentUser;

    public SupportTicketController(SupportTicketService supportTicketService, CurrentUser currentUser) {
        this.supportTicketService = supportTicketService;
        this.currentUser = currentUser;
    }

    @PostMapping
    SupportTicketResponse create(@Valid @RequestBody SupportTicketRequest request) {
        return supportTicketService.create(currentUser.require().id(), request);
    }

    @GetMapping
    List<SupportTicketResponse> mine() {
        return supportTicketService.mine(currentUser.require().id());
    }
}
