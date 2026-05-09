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
        return users.findByEmailIgnoreCase(email).orElseGet(() -> {
            AppUser user = new AppUser();
            user.setEmail(email);
            user.setMobile(mobile);
            user.setFullName(name);
            user.setPasswordHash(encoder.encode(password));
            user.setRoles(Set.of(role));
            return users.save(user);
        });
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
        ensurePackage(packages, "varanasi-spiritual-circuit", "Varanasi Spiritual Circuit", "Varanasi, Sarnath, Ganga Aarti", "Spiritual", 4, new BigDecimal("18500"), true);
        ensurePackage(packages, "kerala-backwater-retreat", "Kerala Backwater Retreat", "Alleppey, Munnar, Kochi", "Holiday", 6, new BigDecimal("42000"), true);
        ensurePackage(packages, "himachal-mountain-week", "Himachal Mountain Week", "Shimla, Manali, Solang", "Adventure", 7, new BigDecimal("36750"), false);
        ensurePackage(packages, "goa-coastal-family-break", "Goa Coastal Family Break", "North Goa, South Goa, Panaji", "Family", 5, new BigDecimal("28500"), true);
        ensurePackage(packages, "jaipur-udaipur-heritage-route", "Jaipur Udaipur Heritage Route", "Jaipur, Pushkar, Udaipur", "Heritage", 6, new BigDecimal("33200"), false);
        ensurePackage(packages, "rishikesh-haridwar-wellness-trip", "Rishikesh Haridwar Wellness Trip", "Rishikesh, Haridwar, Ganga Ghats", "Wellness", 4, new BigDecimal("21800"), false);
    }

    private void ensurePackage(TravelPackageRepository packages, String slug, String title, String destination,
                               String category, int days, BigDecimal price, boolean featured) {
        if (packages.existsBySlug(slug)) {
            return;
        }
        TravelPackage pack = new TravelPackage();
        pack.setSlug(slug);
        pack.setTitle(title);
        pack.setDestination(destination);
        pack.setCategory(category);
        pack.setSummary("Company-reviewed curated travel package with support visibility.");
        pack.setDescription("A curated CarHub package where requests are reviewed by the company before provider assignment.");
        pack.setDurationDays(days);
        pack.setStartingPrice(price);
        pack.setCurrency("INR");
        pack.setImageUrl("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80");
        pack.setFeatured(featured);
        pack.setAvailabilityStatus("AVAILABLE");
        packages.save(pack);
    }

    private void ensureContentPages(ContentPageRepository pages) {
        ensureContentPage(pages, "about", "About CarHub",
                "Company-controlled travel discovery with accountable support.",
                "CarHub helps customers discover curated travel packages while the company remains the central authority for approvals, provider sharing, support, and customer communication.",
                null, null, null);
        ensureContentPage(pages, "contact", "Contact Us",
                "Reach the CarHub team for travel requests, support, and provider coordination.",
                "For package assistance, account help, or travel support, contact CarHub operations. Provider communication remains company-controlled for customer safety and service quality.",
                "support@carhub.local", "+91 90000 00000", "Daily, 9:00 AM - 9:00 PM IST");
        ensureContentPage(pages, "privacy", "Privacy Policy",
                "CarHub protects customer data through controlled provider visibility.",
                "Customer personal data and request details are shared with providers only after company review, approval, masking, and assignment. Access is scoped, time-bound, revocable, and audited.",
                null, null, null);
        ensureContentPage(pages, "terms", "Terms and Conditions",
                "Use CarHub through the company-approved request and support workflow.",
                "Customers submit requests to CarHub for review. Providers are execution partners and do not own the customer relationship. Company decisions, verification, support, and operational policies govern platform use.",
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
