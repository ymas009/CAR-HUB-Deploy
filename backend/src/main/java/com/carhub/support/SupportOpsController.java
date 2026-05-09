package com.carhub.support;

import com.carhub.support.dto.SupportTicketResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/support/tickets")
public class SupportOpsController {
    private final SupportTicketService supportTicketService;

    public SupportOpsController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    @GetMapping
    List<SupportTicketResponse> all() {
        return supportTicketService.all();
    }
}
