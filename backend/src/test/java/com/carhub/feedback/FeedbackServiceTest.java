package com.carhub.feedback;

import com.carhub.audit.AuditService;
import com.carhub.common.BusinessRuleException;
import com.carhub.booking.TicketRepository;
import com.carhub.domain.RequestStatus;
import com.carhub.feedback.dto.FeedbackRequest;
import com.carhub.request.PackageRequest;
import com.carhub.request.PackageRequestRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FeedbackServiceTest {
    @Test
    void feedbackRequiresCompletedTrip() {
        UUID customerId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        AppUser customer = new AppUser();
        customer.setId(customerId);
        PackageRequest request = new PackageRequest();
        request.setCustomer(customer);
        request.setStatus(RequestStatus.IN_PROGRESS);

        PackageRequestRepository requests = mock(PackageRequestRepository.class);
        when(requests.findById(requestId)).thenReturn(Optional.of(request));

        FeedbackService service = new FeedbackService(mock(FeedbackRepository.class), requests, mock(TicketRepository.class), mock(AppUserRepository.class), mock(AuditService.class));

        assertThrows(BusinessRuleException.class,
                () -> service.create(customerId, new FeedbackRequest(requestId, null, 5, 5, 5, "Good")));
    }
}
