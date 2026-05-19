package com.carhub;

import com.carhub.payment.RazorpayProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(RazorpayProperties.class)
public class CarHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(CarHubApplication.class, args);
    }
}
