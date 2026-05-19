package com.carhub.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessRuleException.class)
    ResponseEntity<ApiError> handleBusinessRule(BusinessRuleException exception, HttpServletRequest request) {
        HttpStatus status = switch (exception.code()) {
            case "FORBIDDEN" -> HttpStatus.FORBIDDEN;
            case "PACKAGE_NOT_FOUND", "USER_NOT_FOUND", "PROVIDER_PROFILE_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            case "PACKAGE_NOT_COMPLETED", "INVALID_PACKAGE_DECISION",
                 "INVALID_PICKUP_AVAILABILITY", "PACKAGE_NOT_PROVIDER_SUBMITTED" -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.CONFLICT;
        };
        return ResponseEntity.status(status)
                .body(ApiError.of(exception.code(), exception.getMessage(), traceId(request)));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, Object> details = exception.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a));
        return ResponseEntity.badRequest()
                .body(new ApiError("VALIDATION_FAILED", "Please correct the highlighted fields.", traceId(request), java.time.Instant.now(), details));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of("INTERNAL_ERROR", "Something went wrong. Please try again.", traceId(request)));
    }

    private String traceId(HttpServletRequest request) {
        String header = request.getHeader("X-Trace-Id");
        return header != null && !header.isBlank() ? header : UUID.randomUUID().toString();
    }
}
