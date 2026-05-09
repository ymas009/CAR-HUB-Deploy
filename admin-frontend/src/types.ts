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
  currency: string;
  durationDays: number;
  imageUrl: string;
  featured: boolean;
  availabilityStatus?: string;
  providerBusinessName?: string;
  reviewNotes?: string;
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
  businessName: string;
  contactPerson: string;
  verificationStatus: string;
  suspended: boolean;
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
  requestId: string;
  packageRating: number;
  supportRating: number;
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
