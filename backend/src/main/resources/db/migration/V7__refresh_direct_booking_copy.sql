UPDATE travel_package
SET
    summary = 'Direct booking travel package with verified provider support.',
    description = 'A curated CarHub package with secure payment, ticket generation, and direct provider handoff.'
WHERE summary = 'Company-reviewed curated travel package with support visibility.'
   OR description = 'A curated CarHub package where requests are reviewed by the company before provider assignment.';

UPDATE content_page
SET
    summary = 'Direct booking travel discovery with accountable support.',
    body = 'CarHub helps customers discover curated travel packages, pay securely, receive a ticket instantly, and connect directly with verified providers while admin continues to track operations.',
    updated_at = now()
WHERE slug = 'about'
  AND summary = 'Company-controlled travel discovery with accountable support.';

UPDATE content_page
SET
    summary = 'Reach the CarHub team for booking help, support, and platform assistance.',
    body = 'For package assistance, account help, or travel support, contact CarHub operations. Providers manage trip execution directly after a ticket is generated, and admin can still track the booking.',
    updated_at = now()
WHERE slug = 'contact'
  AND summary = 'Reach the CarHub team for travel requests, support, and provider coordination.';

UPDATE content_page
SET
    summary = 'CarHub protects customer data while enabling direct booking execution.',
    body = 'Customer data is shared only as needed to complete a booked trip. Providers receive operational trip details and a masked customer reference, while admin retains the full audit trail and booking record.',
    updated_at = now()
WHERE slug = 'privacy'
  AND summary = 'CarHub protects customer data through controlled provider visibility.';

UPDATE content_page
SET
    summary = 'Use CarHub through the booking, payment, and ticket workflow.',
    body = 'Customers can book available packages, complete payment, and receive a ticket. Providers manage approved package inventory and trip execution, while CarHub admin tracks bookings, package availability, support, and operational policy.',
    updated_at = now()
WHERE slug = 'terms'
  AND summary = 'Use CarHub through the company-approved request and support workflow.';
