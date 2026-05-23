export type Role = "GUEST" | "CUSTOMER" | "ADMIN" | "SUB_ADMIN" | "SUPPORT" | "PROVIDER";

export type RequestStatus =
  | "DRAFT"
  | "REQUEST_SUBMITTED"
  | "UNDER_REVIEW"
  | "CLARIFICATION_REQUESTED"
  | "APPROVED_BY_COMPANY"
  | "REJECTED_BY_COMPANY"
  | "PAYMENT_PENDING"
  | "FORWARDED_TO_PROVIDER"
  | "ACCEPTED_BY_PROVIDER"
  | "IN_PROGRESS"
  | "SUPPORT_ESCALATION"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "REFUND_INITIATED"
  | "REFUND_COMPLETED";

export interface PackageCard {
  id: string;
  title: string;
  destination: string;
  category: string;
  duration: string;
  price: string;
  image: string;
  trust: string;
  accent: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles: Role[];
  profileComplete: boolean;
  token: string;
}

export interface ApiPackage {
  id: string;
  slug: string;
  title: string;
  destination: string;
  category: string;
  summary: string;
  description: string;
  startingPrice: number;
  distanceKm?: number;
  pricePerKm?: number;
  providerPayout?: number;
  currency: string;
  durationDays: number;
  imageUrl: string;
  videoUrl?: string;
  carPhotoUrl?: string;
  localPlaces?: string;
  carType?: string;
  licenseNumber?: string;
  licenseHolderName?: string;
  licenseDetails?: string;
  licenseDocumentUrl?: string;
  carNumber?: string;
  carModel?: string;
  carColor?: string;
  seatsAvailable?: number;
  providerNotes?: string;
  pickupAvailabilityMode?: "ALWAYS" | "SPECIFIC";
  pickupStartTime?: string;
  pickupEndTime?: string;
  featured: boolean;
  availabilityStatus?: string;
  providerBusinessName?: string;
  reviewNotes?: string;
  rcNumber?: string;
  rcDocumentUrl?: string;
  repostedFromId?: string;
  providerCompletedCount?: number;
  region?: string;
  routeOrder?: string;
  totalDistanceKm?: number;
  subPlaces?: string;
}

export interface BookingTicket {
  id: string;
  ticketNumber: string;
  packageId: string;
  packageName: string;
  destination: string;
  route: string;
  travellersCount: number;
  carType: "FOUR_SEATER" | "SIX_SEATER";
  carDetails: string;
  carPhotoUrl?: string;
  carNumber?: string;
  carModel?: string;
  carColor?: string;
  specialRequests?: string;
  pickupLocation?: string;
  pickupDate?: string;
  pickupTime?: string;
  paymentReference?: string;
  status: string;
  providerBusinessName: string;
  providerContactNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  travellersDetails?: string;
  providerLatitude?: string;
  providerLongitude?: string;
  providerLocationUpdatedAt?: string;
  journeyStartedAt?: string;
  completionOtpExpiresAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ApiRequest {
  id: string;
  status: RequestStatus;
  destination: string;
  travelersCount: number;
  travelStartDate: string;
  travelEndDate: string;
  tripType: string;
  createdAt: string;
}

export interface ProviderProfile {
  id: string;
  userId?: string;
  businessName: string;
  contactPerson: string;
  email?: string;
  mobile?: string;
  businessAddress?: string;
  pinCode?: string;
  serviceLocations?: string;
  categories?: string;
  rcNumber?: string;
  rcDocumentUploaded?: boolean;
  verificationStatus: string;
  suspended: boolean;
  qualityScore?: number;
  complaintCount?: number;
  documentExpiryDate?: string;
  packageCount?: number;
  bookingCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerOverview {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  preferredTravelType?: string;
  emergencyContactName?: string;
  emergencyContactMobile?: string;
  profileCompleted: boolean;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderAssignment {
  assignmentId: string;
  status: RequestStatus;
  visibleFields: string;
  maskedPayload: string;
  expiresAt?: string;
  policy: string;
}

export interface SupportTicket {
  id: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  slaDueAt?: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  requestId?: string;
  ticketId?: string;
  packageRating: number;
  providerRating: number;
  supportRating: number;
  comment?: string;
  moderationStatus: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId?: string;
  actorRole?: string;
  entityType: string;
  entityId?: string;
  action: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  createdAt: string;
}

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  contactEmail?: string;
  contactPhone?: string;
  supportHours?: string;
  published: boolean;
  updatedAt: string;
}
