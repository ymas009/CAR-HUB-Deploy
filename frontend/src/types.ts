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
  place: string;
  destination?: string;
  distance_from_pune: string;
  travel_time: string;
  durationDays?: number;
  startingPrice?: number;
  currency?: string;
  highlights: string;
  category: string;
  image: string;
  video?: string;
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

export type CarType = "FOUR_SEATER" | "SIX_SEATER";
export type TicketStatus = "BOOKED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface BookingTicket {
  id: string;
  ticketNumber: string;
  packageId: string;
  packageName: string;
  destination: string;
  route: string;
  travellersCount: number;
  carType: CarType;
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
  status: TicketStatus;
  providerBusinessName: string;
  providerContactNumber: string;
  createdAt: string;
}

export interface PaymentOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  packageName: string;
}

export interface PaymentVerification {
  verified: boolean;
  paymentReference: string;
}

export interface ProviderTicket {
  id: string;
  ticketNumber: string;
  packageName: string;
  destination: string;
  route: string;
  travellersCount: number;
  carType: CarType;
  carPhotoUrl?: string;
  carNumber?: string;
  carModel?: string;
  carColor?: string;
  specialRequests?: string;
  pickupLocation?: string;
  pickupDate?: string;
  pickupTime?: string;
  maskedCustomerRef: string;
  status: TicketStatus;
  createdAt: string;
}

export interface FeedbackItem {
  id: string;
  requestId: string;
  packageRating: number;
  supportRating: number;
  moderationStatus: string;
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
