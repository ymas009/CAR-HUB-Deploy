package com.carhub.config;

import com.carhub.domain.RoleCode;
import com.carhub.content.ContentPage;
import com.carhub.content.ContentPageRepository;
import com.carhub.packagecatalog.TravelPackage;
import com.carhub.packagecatalog.TravelPackageRepository;
import com.carhub.provider.ProviderProfile;
import com.carhub.provider.ProviderProfileRepository;
import com.carhub.user.AppUser;
import com.carhub.user.AppUserRepository;
import com.carhub.user.CustomerProfile;
import com.carhub.user.CustomerProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seedData(AppUserRepository users, CustomerProfileRepository profiles,
                               ProviderProfileRepository providers, TravelPackageRepository packages,
                               ContentPageRepository contentPages,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            AppUser admin = ensureUser(users, passwordEncoder, "admin@carhub.local", "9000000001", "Company Admin", "Admin@12345", RoleCode.ADMIN);
            AppUser customer = ensureUser(users, passwordEncoder, "customer@carhub.local", "9000000002", "Aarav Sharma", "Customer@12345", RoleCode.CUSTOMER);
            AppUser providerUser = ensureUser(users, passwordEncoder, "provider@carhub.local", "9000000003", "Verified Provider", "Provider@12345", RoleCode.PROVIDER);
            ensureCustomerProfile(profiles, customer);
            ensureProvider(providers, providerUser);
            ensurePackages(packages);
            ensureContentPages(contentPages);
        };
    }

    private AppUser ensureUser(AppUserRepository users, PasswordEncoder encoder, String email, String mobile,
                               String name, String password, RoleCode role) {
        AppUser user = users.findByEmailIgnoreCase(email)
                .or(() -> users.findByMobile(mobile))
                .orElseGet(() -> {
                    AppUser newUser = new AppUser();
                    newUser.setEmail(email);
                    newUser.setMobile(mobile);
                    newUser.setFullName(name);
                    newUser.setPasswordHash(encoder.encode(password));
                    return newUser;
                });

        if (user.getRoles().contains(role)) {
            return user;
        }

        user.getRoles().add(role);
        return users.save(user);
    }

    private void ensureCustomerProfile(CustomerProfileRepository profiles, AppUser customer) {
        profiles.findByUserId(customer.getId()).orElseGet(() -> {
            CustomerProfile profile = new CustomerProfile();
            profile.setUser(customer);
            profile.setCity("Delhi");
            profile.setState("Delhi");
            profile.setCountry("India");
            profile.setPreferredTravelType("Family holiday");
            profile.setEmergencyContactName("Emergency Contact");
            profile.setEmergencyContactMobile("9999999999");
            profile.setConsentPrivacy(true);
            profile.setConsentTerms(true);
            profile.setConsentControlledDataSharing(true);
            profile.setProfileCompleted(true);
            return profiles.save(profile);
        });
    }

    private void ensureProvider(ProviderProfileRepository providers, AppUser providerUser) {
        providers.findByUserId(providerUser.getId()).orElseGet(() -> {
            ProviderProfile profile = new ProviderProfile();
            profile.setUser(providerUser);
            profile.setBusinessName("CarHub Verified Travel Partner");
            profile.setContactPerson("Provider Operations");
            profile.setVerificationStatus("APPROVED");
            profile.setSuspended(false);
            return providers.save(profile);
        });
    }

    private void ensurePackages(TravelPackageRepository packages) {
        ensurePackage(packages, "varanasi-spiritual-circuit", "Shirdi Spiritual Route", "Shirdi, Sai Baba Temple, Kopargaon", "Spiritual", 2, new BigDecimal("9200"), true);
        ensurePackage(packages, "kerala-backwater-retreat", "Mahabaleshwar & Panchgani Retreat", "Mahabaleshwar, Panchgani, Venna Lake", "Scenic Town", 3, new BigDecimal("14500"), true);
        ensurePackage(packages, "himachal-mountain-week", "Lonavala & Khandala Hills", "Lonavala, Khandala, Karla Caves", "Hill Station", 2, new BigDecimal("8500"), true);
        ensurePackage(packages, "goa-coastal-family-break", "Alibaug Coastal Break", "Alibaug, Kulaba Fort, Mandwa Coast", "Beach", 2, new BigDecimal("11900"), true);
        ensurePackage(packages, "jaipur-udaipur-heritage-route", "Nashik Vineyard & Heritage", "Nashik, Sula Vineyards, Trimbakeshwar", "Heritage", 3, new BigDecimal("13200"), false);
        ensurePackage(packages, "rishikesh-haridwar-wellness-trip", "Kolad Adventure Route", "Kolad, Kundalika River, Rafting Base", "Adventure", 2, new BigDecimal("10750"), false);
    }

    private void ensurePackage(TravelPackageRepository packages, String slug, String title, String destination,
                               String category, int days, BigDecimal price, boolean featured) {
        Optional<TravelPackage> existing = packages.findBySlug(slug);
        TravelPackage pack = existing.orElseGet(TravelPackage::new);
        if (existing.isPresent() && "BOOKED".equals(pack.getAvailabilityStatus())) {
            pack.setFeatured(false);
            packages.save(pack);
            return;
        }
        pack.setSlug(slug);
        pack.setTitle(title);
        pack.setDestination(destination);
        pack.setCategory(category);
        pack.setSummary("Direct booking Maharashtra package from Pune with verified provider support.");
        pack.setDescription("A curated CarHub Maharashtra route from Pune with secure payment, ticket generation, and direct provider handoff.");
        pack.setDurationDays(days);
        pack.setStartingPrice(price);
        pack.setCurrency("INR");
        pack.setImageUrl("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80");
        pack.setVideoUrl(
                "varanasi-spiritual-circuit".equals(slug)
                        ? "/Shirdi%20spritual.mp4"
                        : "goa-coastal-family-break".equals(slug)
                        ? "/alibag.mp4"
                        : "kerala-backwater-retreat".equals(slug)
                                ? "/mahabaleshwar.mp4"
                        : "himachal-mountain-week".equals(slug)
                                ? "/lonavala-video.mp4"
                : null
        );
        if (existing.isEmpty() || pack.getAvailabilityStatus() == null || pack.getAvailabilityStatus().isBlank()) {
            pack.setAvailabilityStatus("AVAILABLE");
        }
        pack.setFeatured("AVAILABLE".equals(pack.getAvailabilityStatus()) && featured);
        packages.save(pack);
    }

    private void ensureContentPages(ContentPageRepository pages) {
        ensureContentPage(pages, "about", "About CarHub",
                "Direct booking travel discovery with accountable support.",
                "CarHub helps customers discover curated travel packages, pay securely, receive a ticket instantly, and connect directly with verified providers while admin continues to track operations.",
                null, null, null);
        ensureContentPage(pages, "contact", "Contact Us",
                "Reach the CarHub team for booking help, support, and platform assistance.",
                "For package assistance, account help, or travel support, contact CarHub operations. Providers manage trip execution directly after a ticket is generated, and admin can still track the booking.",
                "support@carhub.local", "+91 90000 00000", "Daily, 9:00 AM - 9:00 PM IST");
        ensureContentPage(pages, "privacy", "Privacy Policy",
                "CarHub protects customer data while enabling direct booking execution.",
                "Customer data is shared only as needed to complete a booked trip. Providers receive operational trip details and a masked customer reference, while admin retains the full audit trail and booking record.",
                null, null, null);
        ensureContentPage(pages, "terms", "Terms and Conditions",
                "Use CarHub through the booking, payment, and ticket workflow.",
                "Customers can book available packages, complete payment, and receive a ticket. Providers manage approved package inventory and trip execution, while CarHub admin tracks bookings, package availability, support, and operational policy.",
                null, null, null);
        ensureContentPage(pages, "cancellation-refund", "Cancellation and Refund Policy",
                "Cancellations, reschedules, and refunds are handled by CarHub operations.",
                "CarHub reviews cancellation, reschedule, dispute, and refund cases based on package status, operational feasibility, provider execution evidence, and applicable policy.",
                null, null, null);
    }

    private void ensureContentPage(ContentPageRepository pages, String slug, String title, String summary, String body,
                                   String email, String phone, String hours) {
        if (pages.existsBySlug(slug)) {
            return;
        }
        ContentPage page = new ContentPage();
        page.setSlug(slug);
        page.setTitle(title);
        page.setSummary(summary);
        page.setBody(body);
        page.setContactEmail(email);
        page.setContactPhone(phone);
        page.setSupportHours(hours);
        page.setPublished(true);
        pages.save(page);
    }
}
