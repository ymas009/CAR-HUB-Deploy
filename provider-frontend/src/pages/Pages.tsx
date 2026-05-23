import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { pickupPoints } from "../data/pickupPoints";

import {
  ArrowRight,
  Castle,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Crown,
  Download,
  Headphones,
  Heart,
  Eye,
  EyeOff,
  LifeBuoy,
  LockKeyhole,
  MapPin,
  Mountain,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SunMedium,
  TicketCheck,
  Users,
  IdCard,
  Waves,
  X
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { packages as fallbackPackages, workflow } from "../data/mockData";
import { ApiRequestError, api } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { matchesPackageQuery } from "../utils/packageSearch";
import {
  ApiPackage,
  BookingTicket,
  CarType,
  ContentPage,
  PackageCard,
  PaymentOrder,
  PaymentVerification,
  ProviderTicket
} from "../types";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

const travellerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  age: z.coerce.number().int("Age must be a whole number.").min(1, "Age must be at least 1."),
  gender: z.string().trim().min(1, "Select gender.")
});

const bookingSchema = z.object({
  travellersCount: z.coerce.number().int().min(1, "Select at least one traveller.").max(6, "Maximum 6 travellers allowed."),
  carType: z.enum(["FOUR_SEATER", "SIX_SEATER"]),
  travellers: z.array(travellerSchema),
  specialRequests: z.string().trim().optional(),
  pickupLocation: z.string().trim().min(3, "Pickup location is required."),
  pickupDate: z.string().min(1, "Pickup date is required."),
  pickupTime: z.string().min(1, "Pickup time is required.")
}).superRefine((value, context) => {
  if (value.travellers.length !== value.travellersCount) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["travellers"], message: "Traveller details must match traveller count." });
  }
  if (value.travellersCount > 4 && value.carType === "FOUR_SEATER") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["carType"], message: "4-seater is disabled for more than 4 travellers." });
  }
});

const mobilePattern = /^(\+?\d{1,3}[-\s]?)?[6-9]\d{9}$|^\+?[1-9]\d{7,14}$/;

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

const registrationBaseSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  mobile: z.string().trim().regex(mobilePattern, "Enter a valid mobile number."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/\d/, "Password must include a number.")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character."),
  addressMode: z.enum(["manual", "current"]),
  address: z.string().trim().min(8, "Address is required."),
  pinCode: z.string().trim().optional(),
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
  consent: z.boolean().refine(Boolean, "Consent is required to create an account.")
});

const registerSchema = registrationBaseSchema.superRefine((value, context) => {
  if (value.addressMode === "current" && (!value.latitude || !value.longitude)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Select current location to continue." });
  }
});

const providerRegisterSchema = registrationBaseSchema.extend({
  rcNumber: z.string().trim().optional(),
  rcDocumentImage: z.string().trim().optional()
}).superRefine((value, context) => {
  if (value.addressMode === "current" && (!value.latitude || !value.longitude)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Select current location to continue." });
  }
});

const forgotSchema = z.object({
  identity: z.string().trim().min(1, "Enter your registered email or mobile number.")
});

const otpSchema = z.object({
  otp: z.string().trim().min(1, "Enter the verification code.")
});

const passwordResetSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/\d/, "Password must include a number.")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character."),
  confirmPassword: z.string()
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match."
});

const providerPackageSchema = z.object({
  destination: z.string().trim().min(3, "Destination is required."),
  customDestination: z.string().trim().optional(),
  localPlaces: z.string().trim().min(3, "Add local places or subplaces."),
  carType: z.enum(["FOUR_SEATER", "SIX_SEATER"]),
  pickupAvailabilityMode: z.enum(["ALWAYS", "SPECIFIC"]),
  pickupStartTime: z.string().trim().optional(),
  pickupEndTime: z.string().trim().optional(),
  carPhotoUrl: z.string().trim().min(1, "Upload car photo."),
  carNumber: z.string().trim().min(4, "Car number is required."),
  carModel: z.string().trim().min(2, "Car name or model is required."),
  licenseNumber: z.string().trim().min(4, "Driving licence number is required."),
  licenseHolderName: z.string().trim().optional(),
  licenseDocumentUrl: z.string().trim().min(1, "Upload driving licence photo or PDF."),
  pricePerKm: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number({ invalid_type_error: "Enter a valid price." }).positive("Price per km must be greater than 0.").optional()
  )
}).superRefine((value, context) => {
  if (value.destination === "__custom" && !value.customDestination?.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["customDestination"], message: "Enter destination name." });
  }
  if (value.pickupAvailabilityMode === "SPECIFIC") {
    if (!value.pickupStartTime) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["pickupStartTime"], message: "Select pickup start time." });
    }
    if (!value.pickupEndTime) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["pickupEndTime"], message: "Select pickup end time." });
    }
  }
});

type FieldErrors = Record<string, string>;

const providerUploadLimitBytes = 4 * 1024 * 1024;
const isProviderPortal = import.meta.env.VITE_PORTAL_MODE === "provider";

interface ReverseGeocodeResult {
  displayName: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  latitude: string;
  longitude: string;
}

interface BigDataCloudReverseResult {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  postcode?: string;
  countryName?: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

function getFieldErrors(error: z.ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
    return errors;
  }, {});
}

function getProviderUploadErrors(form: FormData, requireCarPhoto: boolean, requireLicenseDocument: boolean): FieldErrors {
  const errors: FieldErrors = {};
  const carPhoto = form.get("carPhotoUrl");
  const licenseDocument = form.get("licenseDocumentUrl");
  if (requireCarPhoto && (!(carPhoto instanceof File) || carPhoto.size === 0)) {
    errors.carPhotoUrl = "Upload car photo.";
  }
  if (carPhoto instanceof File && carPhoto.size > providerUploadLimitBytes) {
    errors.carPhotoUrl = "Car photo must be under 4 MB.";
  }
  if (requireLicenseDocument && (!(licenseDocument instanceof File) || licenseDocument.size === 0)) {
    errors.licenseDocumentUrl = "Upload licence file.";
  }
  if (licenseDocument instanceof File && licenseDocument.size > providerUploadLimitBytes) {
    errors.licenseDocumentUrl = "Licence file must be under 4 MB.";
  }
  return errors;
}

function toProviderFieldErrors(exception: unknown): FieldErrors {
  if (exception instanceof ApiRequestError && exception.details) {
    return Object.entries(exception.details).reduce<FieldErrors>((errors, [field, message]) => {
      errors[field] = getProviderFieldMessage(field, message);
      return errors;
    }, {});
  }
  return {};
}

function getProviderFieldMessage(field: string, message: string) {
  if (field === "carPhotoUrl") return "Upload a smaller car photo.";
  if (field === "licenseDocumentUrl") return "Upload a smaller licence file.";
  if (field === "destination") return "Select destination.";
  if (field === "localPlaces") return "Add local places.";
  if (field === "carNumber") return "Enter car number.";
  if (field === "carModel") return "Enter car name.";
  if (field === "licenseNumber") return "Enter licence number.";
  if (field === "pickupStartTime") return "Select start time.";
  if (field === "pickupEndTime") return "Select end time.";
  return message || "Check this field.";
}

function getUserFriendlyError(exception: unknown, fallback: string) {
  if (!(exception instanceof Error)) {
    return fallback;
  }
  const message = exception.message.trim();
  if (!message) {
    return fallback;
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Server is not reachable.";
  }
  if (/internal_error|something went wrong/i.test(message)) {
    return "Server error. Try again.";
  }
  if (/email.*already registered/i.test(message)) {
    return "Email already registered.";
  }
  if (/mobile.*already registered/i.test(message)) {
    return "Mobile number already registered.";
  }
  if (/invalid email or password/i.test(message)) {
    return "Wrong email or password.";
  }
  if (/email.*not registered|email_not_registered/i.test(message)) {
    return "Email not registered.";
  }
  if (/wrong password|wrong_password/i.test(message)) {
    return "Wrong password.";
  }
  if (/account not found|user_not_found/i.test(message)) {
    return "Account not found.";
  }
  if (/please correct the highlighted fields/i.test(message)) {
    return "Enter registered email or mobile.";
  }
  if (/verification code.*incorrect|otp_invalid/i.test(message)) {
    return "Wrong verification code.";
  }
  if (/verification code expired|otp_expired/i.test(message)) {
    return "Verification code expired.";
  }
  return message;
}

function formatDistanceFromPune(distanceKm?: number) {
  return typeof distanceKm === "number" && Number.isFinite(distanceKm)
    ? `${Math.round(distanceKm)} km`
    : "Distance unavailable";
}

function toCard(item: ApiPackage): PackageCard {
  return {
    id: item.id,
    place: item.title,
    distance_from_pune: formatDistanceFromPune(item.distanceKm),
    travel_time: `${item.durationDays} days`,
    highlights: item.summary,
    localPlaces: item.localPlaces,
    category: item.category,
    image: item.imageUrl,
    video: item.videoUrl
  };
}

function loadRazorpayCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-razorpay-checkout]");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Razorpay checkout could not be loaded.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
    document.body.appendChild(script);
  });
}

async function downloadTicketPdf(ticketId: string, ticketNumber?: string) {
  const blob = await api.blob(`/tickets/${ticketId}/pdf`);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `carhub-ticket-${ticketNumber ?? ticketId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isPickupTimeAllowed(pack: ApiPackage | null, pickupTime: string) {
  if (!pack || pack.pickupAvailabilityMode !== "SPECIFIC" || !pack.pickupStartTime || !pack.pickupEndTime) {
    return true;
  }
  const requested = pickupTime.trim();
  const start = pack.pickupStartTime;
  const end = pack.pickupEndTime;
  if (!requested) return true;
  if (start === end) return true;
  return start < end
    ? requested >= start && requested <= end
    : requested >= start || requested <= end;
}

function pickupAvailabilityLabel(pack: ApiPackage | null) {
  if (!pack || pack.pickupAvailabilityMode !== "SPECIFIC" || !pack.pickupStartTime || !pack.pickupEndTime) {
    return "Provider pickup available 24/7";
  }
  return `Provider pickup available ${pack.pickupStartTime} to ${pack.pickupEndTime}`;
}

function usePackages() {
  const [items, setItems] = useState<PackageCard[]>(fallbackPackages);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "fallback">("api");

  useEffect(() => {
    api
      .get<ApiPackage[]>("/packages")
      .then((data) => {
        setItems(data.map(toCard));
      })
      .catch(() => {
        setItems(fallbackPackages);
        setSource("fallback");
      })
      .finally(() => setLoading(false));
  }, []);

  return { items, loading, source };
}

export function HomePage() {
  const navigate = useNavigate();
  const { items } = usePackages();

  return (
    <div className="page">
      <section className="hero-section">
        <div className="hero-media-wrapper">
          <video 
            className="hero-video" 
            autoPlay 
            loop 
            muted 
            playsInline
            src="/hero-background.mp4"
          />
          <div className="hero-overlay" aria-hidden="true"></div>
        </div>
        <motion.div 
          className="hero-content" 
          initial="hidden" 
          animate="visible" 
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { staggerChildren: 0.15, delayChildren: 0.2 }
            }
          }}
        >
          <motion.div className="eyebrow" variants={fadeUp}>
            <ShieldCheck size={18} />
            Direct provider booking
          </motion.div>
          <motion.h1 className="hero-title" variants={fadeUp}>
            Luxury Travel Reimagined.
          </motion.h1>
          <motion.p variants={fadeUp}>
            Curated premium journeys from Pune to Maharashtra's most exclusive destinations.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUp}>
            <button className="primary-button large" onClick={() => navigate("/packages")}>
              Explore Packages
              <ArrowRight size={18} />
            </button>
            <button className="glass-button" onClick={() => navigate("/contact")}>Talk to Support</button>
          </motion.div>
          <motion.div className="trust-grid" variants={fadeUp}>
            {/* {["Admin approved", "Verified partners", "Travel support"].map((item) => (
              <span key={item}>
                <CheckCircle2 size={16} />
                {item}
              </span>
            ))} */}
          </motion.div>
        </motion.div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <span className="eyebrow">Featured journeys</span>
          <h2>Curated destinations starting from Pune.</h2>
        </div>
        <div className="package-grid">
          {items.slice(0, 4).map((item, index) => <PackageTile key={item.id} item={item} index={index} />)}
        </div>
      </section>

      <section className="workflow-band">
        <div>
          <span className="eyebrow">How CarHub works</span>
          <h2>Pay, generate ticket, and connect with your provider.</h2>
        </div>
        <div className="workflow-rail">
          {workflow.map((step, index) => (
            <motion.div className="workflow-step" key={step} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} transition={{ delay: index * 0.08 }}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ExplorePage() {
  const { items, loading, source } = usePackages();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [routeRail, setRouteRail] = useState<HTMLDivElement | null>(null);
  const [chipRail, setChipRail] = useState<HTMLDivElement | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category))).filter(Boolean);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = matchesPackageQuery(item, query);
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, query, selectedCategory]);

  const routeHighlights = useMemo(() => {
    return filteredItems.slice(0, 10);
  }, [filteredItems]);

  const quickFilters = [
    { label: "Weekend Trips", value: null, icon: CalendarDays },
    { label: "Hill Stations", value: categories.find((item) => /hill/i.test(item)) ?? "Hill Station / Scenic Town", icon: Mountain },
    { label: "Beaches", value: categories.find((item) => /beach/i.test(item)) ?? "Beach / Coastal Town", icon: Waves },
    { label: "Forts", value: categories.find((item) => /fort/i.test(item)) ?? "Fort / History", icon: Castle },
    { label: "One Day Trip", value: categories[0] ?? null, icon: SunMedium },
    { label: "Family Tour", value: categories.find((item) => /nature|family/i.test(item)) ?? null, icon: Users },
    { label: "Couple Trip", value: categories.find((item) => /lake|beach|scenic/i.test(item)) ?? null, icon: Heart },
    { label: "Adventure", value: categories.find((item) => /adventure|fort|hill|trek/i.test(item)) ?? null, icon: Mountain },
    { label: "Luxury Stay", value: categories.find((item) => /modern|city|luxury/i.test(item)) ?? null, icon: Crown }
  ];

  function scrollRoutes() {
    routeRail?.scrollBy({ left: 320, behavior: "smooth" });
  }

  function scrollCategories() {
    chipRail?.scrollBy({ left: 220, behavior: "smooth" });
  }

  return (
    <div className="page padded-page explore-page">
      <div className="explore-video-layer" aria-hidden="true">
        <div className="explore-video-overlay" aria-hidden="true" />
      </div>
      <section className="explore-hero">
        <div className="explore-hero-copy">
          <span className="eyebrow">Explore</span>
          <h1>Explore destinations from <span>Pune.</span></h1>
          <div className="search-box explore-search">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Pune to Lonavala, Mahabaleshwar, Alibaug, forts..."
              aria-label="Search packages"
            />
            {query && (
              <button
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button className="icon-button" aria-label="Filter packages"><SlidersHorizontal size={20} /></button>
          </div>
          <div className="explore-chip-row-wrap">
            <div className="explore-chip-row" ref={setChipRail}>
              {quickFilters.map((filter) => {
                const Icon = filter.icon;
                const active = (filter.value === null && selectedCategory === null) || selectedCategory === filter.value;
                return (
                  <button
                    type="button"
                    key={filter.label}
                    className={`explore-chip ${active ? "active" : ""}`}
                    onClick={() => setSelectedCategory(filter.value)}
                  >
                    <Icon size={16} />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="explore-scroll-arrow" aria-label="More categories" onClick={scrollCategories}>&gt;</button>
          </div>
        </div>
        <div className="explore-hero-media">
          <div
            className="explore-hero-media-bg"
            aria-label="Fort view from Maharashtra"
            role="img"
          />
        </div>
      </section>
      {source === "fallback" && (
        <div className="notice-panel">
          Showing sample packages because the backend is not reachable. You can still explore the UI safely.
        </div>
      )}
      {loading && <PackageSkeletonGrid />}
      {!loading && filteredItems.length === 0 && (
        <div className="empty-state">
          <Search size={34} />
          <h2>No packages matched your search.</h2>
          <p>Try a destination, trip type, or theme such as beach, spiritual, family, or holiday.</p>
          <button className="primary-button" onClick={() => setQuery("")}>Clear search</button>
        </div>
      )}
      {!loading && filteredItems.length > 0 && (
        <>
          <section className="explore-routes">
            <div className="explore-section-heading">
              <h2>Popular routes from Pune</h2>
            </div>
            <div className="explore-route-row">
              <div className="explore-route-grid" ref={setRouteRail}>
                {routeHighlights.map((item) => (
                  <Link
                    key={item.id}
                    className="explore-route-card"
                    to={`/packages/${item.id}`}
                  >
                    {item.video ? (
                      <video
                        src={item.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        aria-label={item.place}
                      />
                    ) : (
                      <img src={item.image} alt={item.place} />
                    )}
                    <div className="explore-route-body">
                      <strong>{item.place}</strong>
                      <span><MapPin size={14} /> {item.distance_from_pune} - {item.travel_time}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <button type="button" className="explore-scroll-arrow explore-route-arrow" aria-label="More routes" onClick={scrollRoutes}>&gt;</button>
            </div>
          </section>
          <section className="explore-stats-strip">
            <div className="explore-stat">
              <div className="explore-stat-icon"><MapPin size={18} /></div>
              <div><strong>50+</strong><span>Destinations</span></div>
            </div>
            <div className="explore-stat">
              <div className="explore-stat-icon"><Headphones size={18} /></div>
              <div><strong>24/7</strong><span>Support</span></div>
            </div>
            <div className="explore-stat">
              <div className="explore-stat-icon"><ShieldCheck size={18} /></div>
              <div><strong>Verified</strong><span>Drivers</span></div>
            </div>
            <div className="explore-stat">
              <div className="explore-stat-icon"><TicketCheck size={18} /></div>
              <div><strong>Custom</strong><span>Packages</span></div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function PackageTile({ item, index }: { item: PackageCard; index: number }) {
  const navigate = useNavigate();
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <motion.div className="package-row-container" initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: index * 0.08 }}>
        <div 
          className="package-image-card" 
          onClick={(e) => {
            if (item.video) return; // Don't zoom if it's a video for now, or handle separately
            setIsZoomed(true);
          }} 
          style={{ cursor: item.video ? "default" : "zoom-in" }}
          title={item.video ? undefined : "Click to zoom image"}
        >
          {item.video ? (
            <video 
              src={item.video} 
              autoPlay 
              loop 
              muted 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <img src={item.image} alt={item.place} />
          )}
        </div>
        <div className="package-formal-description" onClick={() => navigate(`/packages/${item.id}`)} style={{ cursor: "pointer" }}>
          <div className="card-meta">
            <span>{item.category}</span>
            <span><Clock3 size={15} /> {item.travel_time}</span>
          </div>
          <h3>{item.place}</h3>
          <p><MapPin size={15} /> {item.distance_from_pune} from Pune</p>
          {item.localPlaces && <p className="package-subplaces-copy"><MapPin size={15} /> Route: {item.localPlaces}</p>}
          <div className="package-footer">
            <strong className="highlights-text">{item.highlights}</strong>
            <Link className="text-link" to={`/packages/${item.id}`}>Details</Link>
          </div>
        </div>
      </motion.div>

      {isZoomed && createPortal(
        <div className="lightbox-overlay" onClick={() => setIsZoomed(false)}>
          <img src={item.image} alt={item.place} className="lightbox-img" />
        </div>,
        document.body
      )}
    </>
  );
}

function PackageSkeletonGrid() {
  return (
    <div className="package-grid" aria-label="Loading package previews">
      {[1, 2, 3, 4].map((item) => (
        <div className="skeleton-card" key={item}>
          <span />
          <div>
            <i />
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PackageDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items } = usePackages();
  const [pack, setPack] = useState<PackageCard | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<ApiPackage>(`/packages/${id}`).then((data) => setPack(toCard(data))).catch(() => {
      setPack(items.find((item) => item.id === id) ?? fallbackPackages[0]);
    });
  }, [id]);

  const selected = pack ?? items.find((item) => item.id === id) ?? fallbackPackages[0];

  return (
    <div className="page padded-page">
      <section className="detail-hero">
        {selected.video ? (
          <video
            src={selected.video}
            autoPlay
            loop
            muted
            playsInline
            aria-label={selected.place}
          />
        ) : (
          <img src={selected.image} alt={selected.place} />
        )}
        <div className="detail-panel">
          <span className="eyebrow">{selected.category}</span>
          <h1>{selected.place}</h1>
          <p>{selected.highlights}. Start your journey from Pune.</p>
          <div className="detail-facts">
            <span><MapPin size={17} />{selected.distance_from_pune}</span>
            <span><Clock3 size={17} />{selected.travel_time}</span>
            <span><LifeBuoy size={17} />Support visible</span>
          </div>
          <button className="primary-button large" onClick={() => navigate(user?.role === "CUSTOMER" ? `/booking/${selected.id}` : "/login", { state: { returnTo: `/booking/${selected.id}` } })}>
            Book Now
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

export function MemberSelectionPage() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pack, setPack] = useState<ApiPackage | null>(null);
  const [travellersCount, setTravellersCount] = useState(1);
  const [carType, setCarType] = useState<CarType>("FOUR_SEATER");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!packageId) return;
    api.get<ApiPackage>(`/packages/${packageId}`)
      .then((data) => {
        setPack(data);
        const type = (data.carType === "SIX_SEATER" ? "SIX_SEATER" : "FOUR_SEATER") as CarType;
        setCarType(type);
        const maxSeats = type === "SIX_SEATER" ? 6 : 4;
        setTravellersCount((prev) => Math.min(prev, maxSeats));
      })
      .catch(() => setPack(null));
  }, [packageId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!packageId) return;
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const travellers = Array.from({ length: travellersCount }, (_, index) => ({
      fullName: String(form.get(`traveller-${index}-name`) ?? ""),
      age: Number(form.get(`traveller-${index}-age`) ?? 0),
      gender: String(form.get(`traveller-${index}-gender`) ?? "")
    }));
    const result = bookingSchema.safeParse({
      travellersCount,
      carType,
      travellers,
      specialRequests: String(form.get("specialRequests") ?? ""),
      pickupLocation: String(form.get("pickupLocation") ?? ""),
      pickupDate: String(form.get("pickupDate") ?? ""),
      pickupTime: String(form.get("pickupTime") ?? "")
    });
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }
    if (!isPickupTimeAllowed(pack, result.data.pickupTime)) {
      setError(pickupAvailabilityLabel(pack));
      return;
    }
    setSubmitting(true);
    try {
      await loadRazorpayCheckout();
      const paymentOrder = await api.post<PaymentOrder>("/payments/create-order", { packageId });
      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error("Razorpay checkout is not available."));
          return;
        }
        const checkout = new window.Razorpay({
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: "CarHub",
          description: paymentOrder.packageName,
          order_id: paymentOrder.orderId,
          prefill: {
            name: user?.name,
            email: user?.email
          },
          theme: {
            color: "#e50914"
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled."))
          },
          handler: async (response) => {
            try {
              const verification = await api.post<PaymentVerification>("/payments/verify", {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });
              if (!verification.verified) {
                reject(new Error("Payment verification failed."));
                return;
              }
              const ticket = await api.post<BookingTicket>("/bookings/submit", {
                packageId,
                ...result.data,
                paymentReference: verification.paymentReference
              });
              navigate(`/booking/confirmation/${ticket.id}`);
              resolve();
            } catch (exception) {
              reject(exception);
            }
          }
        });
        checkout.open();
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Payment could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page padded-page">
      <section className="auth-card booking-card">
        <form className="stacked-form" onSubmit={submit}>
          <div className="booking-layout">
            <div className="booking-main">
              <div className="booking-header">
                <span className="eyebrow"><TicketCheck size={17} />Booking handoff</span>
                <h1>{pack?.title ?? "Book selected package"}</h1>
                <p>{pack ? `${pack.destination} - ${pack.durationDays} days` : "Add traveller and car details to create your ticket."}</p>
              </div>

              <div className="booking-controls">
                <FormField name="travellersCount" error={fieldErrors.travellersCount}>
                  <label className="booking-field-label" htmlFor="travellersCount">Travellers</label>
                  <select id="travellersCount" value={travellersCount} onChange={(event) => setTravellersCount(Number(event.target.value))} aria-label="Number of travellers">
                    {Array.from({ length: carType === "SIX_SEATER" ? 6 : 4 }, (_, i) => i + 1).map((count) => <option key={count} value={count}>{count} traveller{count > 1 ? "s" : ""}</option>)}
                  </select>
                </FormField>
                <div>
                  <span className="booking-field-label">Car type</span>
                  <p className="booking-car-type-label">{carType === "SIX_SEATER" ? "6-seater" : "4-seater"}</p>
                </div>
              </div>

              <div className="booking-section-heading">
                <Users size={18} />
                <h2>Traveller details</h2>
              </div>
              <div className="traveller-grid">
                {Array.from({ length: travellersCount }, (_, index) => (
                  <div className="traveller-panel" key={index}>
                    <h3>Traveller {index + 1}</h3>
                    <div className="traveller-fields">
                      <input name={`traveller-${index}-name`} placeholder="Full name" aria-label={`Traveller ${index + 1} full name`} />
                      <input name={`traveller-${index}-age`} placeholder="Age" type="number" min="1" aria-label={`Traveller ${index + 1} age`} />
                      <select name={`traveller-${index}-gender`} defaultValue="" aria-label={`Traveller ${index + 1} gender`}>
                        <option value="" disabled>Gender</option>
                        <option value="FEMALE">Female</option>
                        <option value="MALE">Male</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              {fieldErrors.travellers && <span className="field-error">{fieldErrors.travellers}</span>}

              <div className="booking-section-heading">
                <MapPin size={18} />
                <h2>Pickup details</h2>
              </div>
              <div className="booking-trip-grid">
                      <input
                      name="pickupLocation"
                      list="pickup-point-options"
                      placeholder="Search pickup point"
                      aria-label="Pickup location"
                      />

                     <datalist id="pickup-point-options">
                      {pickupPoints.map((point) => (
                      <option key={point} value={point} />
                      ))}
                      </datalist>
                     <input name="pickupDate" type="date" aria-label="Pickup date" />
                     <input name="pickupTime" type="time" aria-label="Pickup time" />
              </div>
              <p className="form-helper pickup-availability-note">{pickupAvailabilityLabel(pack)}</p>
              {error && <div className="error-box"><span>{error}</span></div>}
            </div>

            <aside className="booking-summary-panel">
              <div>
                <span className="eyebrow"><CalendarDays size={16} />Trip summary</span>
                <h2>{travellersCount} traveller{travellersCount > 1 ? "s" : ""}</h2>
                <p>{carType === "FOUR_SEATER" ? "4-seater car" : "6-seater car"}</p>
              </div>
              {pack && (
                <div className="booking-summary-list">
                  <span>{pack.destination}</span>
                  <strong>{pack.durationDays} days</strong>
                  <small>{pack.startingPrice ? `From INR ${pack.startingPrice}` : "Price confirmed by package"}</small>
                </div>
              )}
              <button className="primary-button auth-submit-button" type="submit" disabled={submitting}>
                {submitting ? "Processing..." : "Proceed to payment"}
              </button>
            </aside>
          </div>
        </form>
      </section>
    </div>
  );
}

export function BookingConfirmationPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState<BookingTicket | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    api.get<BookingTicket>(`/tickets/${ticketId}`).then(setTicket).catch((exception) => {
      setError(exception instanceof Error ? exception.message : "Ticket could not be loaded.");
    });
  }, [ticketId]);

  return (
    <div className="page padded-page">
      <section className="auth-card booking-card ticket-confirmation-card">
        <div className="ticket-confirmation-header">
          <img src="/carhub-logo.png" alt="CarHub" />
          <div>
            <span className="eyebrow"><CheckCircle2 size={17} />Payment confirmed</span>
            <h1>{ticket?.ticketNumber ?? "Ticket created"}</h1>
            <p>Your ticket PDF has been prepared for download and email delivery.</p>
          </div>
        </div>
        {error && <div className="error-box"><span>{error}</span></div>}
        {ticket && (
          <div className="ticket-confirmation-body">
            <div className="ticket-summary-grid">
              <div><span>Provider</span><strong>{ticket.providerBusinessName}</strong></div>
              <div><span>Provider mobile</span><strong>{ticket.providerContactNumber}</strong></div>
              <div><span>Car</span><strong>{ticket.carDetails}</strong></div>
              <div><span>Car number</span><strong>{ticket.carNumber ?? "Will be confirmed by provider"}</strong></div>
              <div><span>Route</span><strong>{ticket.route}</strong></div>
              <div><span>Pickup</span><strong>{ticket.pickupLocation} - {ticket.pickupDate} {ticket.pickupTime}</strong></div>
              <div><span>Payment ref</span><strong>{ticket.paymentReference}</strong></div>
              <div><span>Travellers</span><strong>{ticket.travellersCount}</strong></div>
            </div>
            <div className="ticket-actions-row">
              <button
                className="primary-button"
                type="button"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  setError("");
                  try {
                    await downloadTicketPdf(ticket.id, ticket.ticketNumber);
                  } catch (exception) {
                    setError(exception instanceof Error ? exception.message : "Ticket PDF could not be downloaded.");
                  } finally {
                    setDownloading(false);
                  }
                }}
              >
                <Download size={17} />
                {downloading ? "Preparing PDF..." : "Download PDF"}
              </button>
              <Link className="outline-button" to="/customer">Customer workspace</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" | "forgot" }) {
  const { login, googleLogin, logout, register, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? (isProviderPortal ? "/provider" : "/customer");
  const authState = location.state as { role?: "CUSTOMER" | "PROVIDER"; formMode?: "login" | "register"; returnTo?: string } | null;
  const defaultRole = isProviderPortal ? "PROVIDER" : null;
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "PROVIDER" | null>(authState?.role ?? defaultRole);
  const [formMode, setFormMode] = useState<"login" | "register">(authState?.formMode ?? (mode === "register" ? "register" : "login"));
  const [recoveryStep, setRecoveryStep] = useState<"request" | "otp" | "password">("request");
  const [identity, setIdentity] = useState("");
  const [otp, setOtp] = useState("");
  const [registrationStep, setRegistrationStep] = useState<"details" | "verify">("details");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setFormMode(authState?.formMode ?? (mode === "register" ? "register" : "login"));
    setSelectedRole(mode === "forgot" ? (isProviderPortal ? "PROVIDER" : null) : (authState?.role ?? defaultRole));
    setRecoveryStep("request");
    setIdentity("");
    setOtp("");
    setRegistrationStep("details");
    setRegistrationEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setShowAuthPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [mode, authState?.formMode, authState?.role, defaultRole]);

  const showSelection = mode !== "forgot" && selectedRole === null;
  const showAuthForm = mode === "forgot" || selectedRole !== null;
  const roleLabel = selectedRole === "PROVIDER" ? "Provider" : "Customer";
  const formHeading = mode === "forgot"
    ? "Recover access"
    : selectedRole
      ? formMode === "register"
        ? `Create ${roleLabel} account`
        : `Sign in as ${roleLabel}`
      : mode === "register"
        ? "Create your CarHub account"
        : "Welcome back";
  const formSubtext = mode === "forgot"
    ? "Use your registered email or mobile number."
    : selectedRole
      ? formMode === "register"
        ? `Create a ${roleLabel.toLowerCase()} account.`
        : `Sign in securely as ${roleLabel}.`
      : mode === "register"
        ? "Choose customer or provider registration."
        : "Choose customer or provider login.";

  function chooseRole(role: "CUSTOMER" | "PROVIDER", action: "login" | "register") {
    setSelectedRole(role);
    setFormMode(action);
    setError("");
    setNotice("");
    setFieldErrors({});
    setRegistrationStep("details");
    setRegistrationEmail("");
  }

  function resetSelection() {
    setSelectedRole(defaultRole);
    setFormMode(mode === "register" ? "register" : "login");
    setError("");
    setNotice("");
    setFieldErrors({});
    setRegistrationStep("details");
    setRegistrationEmail("");
  }

  function openForgotPassword() {
    setFormMode("login");
    setRecoveryStep("request");
    setIdentity("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowAuthPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setNotice("");
    setFieldErrors({});
    navigate("/forgot-password", { state: { role: selectedRole } });
  }

  function goBackFromForgot() {
    setError("");
    setNotice("");
    setFieldErrors({});
    navigate("/login", authState?.role ? { state: { role: authState.role, formMode: "login" } } : undefined);
  }

  async function completeAuthSession(session: Awaited<ReturnType<typeof login>>) {
    if (selectedRole && session.role !== selectedRole) {
      logout();
      setError(`This email is registered as a ${session.role.toLowerCase()} account. Please use the correct workspace.`);
      return;
    }

    if (session.role === "PROVIDER") {
      navigate("/provider");
    } else {
      navigate(returnTo);
    }
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!selectedRole) {
      setError("Choose customer or provider before using Google sign-in.");
      return;
    }
    if (!response.credential) {
      setError("Google sign-in did not return a credential.");
      return;
    }
    setError("");
    setNotice("");
    setFieldErrors({});
    setGoogleSubmitting(true);
    try {
      await completeAuthSession(await googleLogin(response.credential, selectedRole));
    } catch (exception) {
      setError(getUserFriendlyError(exception, "Google sign-in failed."));
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function reverseGeocode(latitude: string, longitude: string): Promise<ReverseGeocodeResult> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`
      );
      if (!response.ok) {
        throw new Error("BigDataCloud reverse geocode failed.");
      }
      const data = await response.json() as BigDataCloudReverseResult;
      const area = data.locality || data.city;
      const parts = [data.locality, data.city, data.principalSubdivision, data.postcode, data.countryName]
        .filter((part): part is string => Boolean(part && part.trim()));
      if (!area || parts.length === 0) {
        throw new Error("BigDataCloud did not return an area name.");
      }
      return {
        displayName: Array.from(new Set(parts)).join(", "),
        area,
        city: data.city,
        state: data.principalSubdivision,
        pinCode: data.postcode,
        latitude,
        longitude
      };
    } catch {
      return api.get<ReverseGeocodeResult>(`/location/reverse?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      if (mode === "forgot") {
        if (recoveryStep === "request") {
          const result = forgotSchema.safeParse({ identity: String(form.get("identity") ?? "") });
          if (!result.success) {
            setFieldErrors(getFieldErrors(result.error));
            return;
          }
          setIdentity(result.data.identity);
          await api.post("/auth/password/forgot", { identity: result.data.identity, email: result.data.identity, flow: "otp" });
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setNotice("Verification code sent to your email.");
          setRecoveryStep("otp");
          return;
        }

        if (recoveryStep === "otp") {
          const result = otpSchema.safeParse({ otp: String(form.get("otp") ?? "") });
          if (!result.success) {
            setFieldErrors(getFieldErrors(result.error));
            return;
          }
          setOtp(result.data.otp);
          setNotice("Code verified. Set a new password.");
          setRecoveryStep("password");
          return;
        }

        const code = otp.trim();
        if (!identity.trim()) {
          setError("Enter registered email or mobile.");
          setRecoveryStep("request");
          return;
        }
        if (!code) {
          setError("Verify the OTP first.");
          setRecoveryStep("otp");
          return;
        }
        const result = passwordResetSchema.safeParse({
          newPassword: String(form.get("newPassword") ?? ""),
          confirmPassword: String(form.get("confirmPassword") ?? "")
        });
        if (!result.success) {
          setFieldErrors(getFieldErrors(result.error));
          return;
        }
        await api.post("/auth/password/reset", {
          identity,
          email: identity,
          otp: code,
          newPassword: result.data.newPassword
        });
        setRecoveryStep("request");
        setIdentity("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        navigate("/login", authState?.role ? { state: { role: authState.role, formMode: "login" } } : undefined);
        return;
      }

      let session;
      if (formMode === "register") {
        if (registrationStep === "verify") {
          const code = String(form.get("registrationOtp") ?? "").trim();
          if (!code) {
            setFieldErrors({ registrationOtp: "Enter the verification code sent to your email." });
            return;
          }
          session = await confirmRegistration(registrationEmail, code);
        } else {
        const rcFile = form.get("rcDocumentImage");
        const rawRegistration = {
          fullName: String(form.get("fullName") ?? ""),
          mobile: String(form.get("mobile") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          addressMode: "manual",
          address: String(form.get("address") ?? ""),
          pinCode: String(form.get("pinCode") ?? ""),
          latitude: "",
          longitude: "",
          rcNumber: String(form.get("rcNumber") ?? ""),
          rcDocumentImage: rcFile instanceof File && rcFile.size > 0 ? rcFile.name : "",
          consent: form.get("consent") === "on"
        };
        const result = (selectedRole === "PROVIDER" ? providerRegisterSchema : registerSchema).safeParse(rawRegistration);
        if (!result.success) {
          setFieldErrors(getFieldErrors(result.error));
          return;
        }
        const rcDocumentImage = selectedRole === "PROVIDER" && rcFile instanceof File ? await fileToDataUrl(rcFile) : undefined;
        await register({
          accountType: selectedRole,
          fullName: result.data.fullName,
          email: result.data.email,
          mobile: result.data.mobile,
          password: result.data.password,
          city: selectedRole === "PROVIDER" ? "Provider city" : "Pune",
          state: selectedRole === "PROVIDER" ? "Provider state" : "Maharashtra",
          country: "India",
          address: result.data.address,
          pinCode: result.data.pinCode,
          latitude: result.data.latitude,
          longitude: result.data.longitude,
          rcNumber: "rcNumber" in result.data ? result.data.rcNumber : undefined,
          rcDocumentImage,
          preferredTravelType: "Family holiday",
          emergencyContactName: result.data.fullName,
          emergencyContactMobile: result.data.mobile,
          consentTerms: true,
          consentPrivacy: true,
          consentControlledDataSharing: true
        });
        setRegistrationEmail(result.data.email);
        setRegistrationStep("verify");
        setNotice("A verification code has been sent to your email. Enter it to complete registration.");
        return;
        }
      } else {
        const result = loginSchema.safeParse({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? "")
        });
        if (!result.success) {
          setFieldErrors(getFieldErrors(result.error));
          return;
        }
        session = await login(result.data.email, result.data.password);
      }

      await completeAuthSession(session);
    } catch (exception) {
      setError(getUserFriendlyError(
        exception,
        mode === "forgot"
          ? "Password recovery failed."
          : formMode === "register"
            ? "Registration failed."
            : "Sign in failed."
      ));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <motion.section className={`auth-card ${formMode === "register" ? "registration-card" : ""} ${selectedRole === "PROVIDER" ? "provider-registration-card" : ""}`} initial="hidden" animate="visible" variants={fadeUp}>
        <img className="auth-card-logo" src="/carhub-logo.png" alt="CarHub" />
        <span className="eyebrow"><LockKeyhole size={17} />Protected CarHub access</span>
        <h1>{formHeading}</h1>
        <p className="auth-subtext">{formSubtext}</p>

        {showSelection && (
          <div className="auth-role-selector compact">
            <button type="button" className="role-button customer" onClick={() => chooseRole("CUSTOMER", mode === "register" ? "register" : "login")}>
              <span className="role-name">Customer</span>
            </button>
            <button type="button" className="role-button provider" onClick={() => chooseRole("PROVIDER", mode === "register" ? "register" : "login")}>
              <span className="role-name">Provider</span>
            </button>
          </div>
        )}

        {showAuthForm && (
          <>
            {mode === "forgot" && (
              <div className="auth-actions-bar">
                <button type="button" className="text-link" onClick={goBackFromForgot}>Go back</button>
              </div>
            )}
            {selectedRole && mode !== "forgot" && registrationStep === "details" && (
              <>
                <div className="google-auth-panel">
                  {googleClientId ? (
                    <>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google sign-in was cancelled or failed.")}
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        width="320"
                        text={formMode === "register" ? "signup_with" : "signin_with"}
                      />
                      {googleSubmitting && <span className="form-helper">Completing Google sign-in...</span>}
                    </>
                  ) : (
                    <span className="form-helper">Google sign-in is not configured for this app.</span>
                  )}
                </div>
                <div className="google-auth-divider">Or</div>
              </>
            )}
            {selectedRole && mode !== "forgot" && (
              <div className="auth-actions-bar">
                <button type="button" className="text-link" onClick={() => setFormMode(formMode === "register" ? "login" : "register")}>
                  {formMode === "register" ? "Already have an account? Sign in" : "Create an account"}
                </button>
                {!isProviderPortal && <button type="button" className="text-link" onClick={resetSelection}>Back to options</button>}
                {isProviderPortal && (
                  <a
                    className="text-link"
                    href={`${(import.meta.env.VITE_CUSTOMER_APP_URL ?? "http://localhost:5173").replace(/\/$/, "")}/login`}
                  >
                    Back to options
                  </a>
                )}
              </div>
            )}
            <form className="stacked-form" onSubmit={submit}>
              {formMode === "register" && registrationStep === "details" && (
                <>
                  <FormField name="fullName" error={fieldErrors.fullName}>
                    <input name="fullName" placeholder="Full name" autoComplete="name" aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby="fullName-error" />
                  </FormField>
                  <FormField name="mobile" error={fieldErrors.mobile}>
                    <input name="mobile" placeholder="Mobile number" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(fieldErrors.mobile)} aria-describedby="mobile-error" />
                  </FormField>
                  {registrationStep === "details" && (
                    <>
                      <FormField name="address" error={fieldErrors.address}>
                        <textarea name="address" placeholder="Address" autoComplete="street-address" aria-invalid={Boolean(fieldErrors.address)} aria-describedby="address-error" />
                      </FormField>
                    </>
                  )}
                </>
              )}
              {mode !== "forgot" && (formMode !== "register" || registrationStep === "details") && (
                <FormField name="email" error={fieldErrors.email}>
                  <input name="email" placeholder="Gmail ID / email" type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby="email-error" />
                </FormField>
              )}
              {formMode === "register" && registrationStep === "verify" && (
                <FormField name="registrationOtp" error={fieldErrors.registrationOtp}>
                  <input name="registrationOtp" placeholder="Email verification code" inputMode="numeric" aria-invalid={Boolean(fieldErrors.registrationOtp)} aria-describedby="registrationOtp-error" />
                </FormField>
              )}
              {mode !== "forgot" && (formMode !== "register" || registrationStep === "details") && (
                <FormField name="password" error={fieldErrors.password}>
                  <div className="password-input-wrap">
                    <input name="password" placeholder="Password" type={showAuthPassword ? "text" : "password"} autoComplete={formMode === "register" ? "new-password" : "current-password"} aria-invalid={Boolean(fieldErrors.password)} aria-describedby="password-error password-help" />
                    <button type="button" className="password-visibility-button" onClick={() => setShowAuthPassword((value) => !value)} aria-label={showAuthPassword ? "Hide password" : "Show password"}>
                      {showAuthPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {formMode === "register" && <span className="form-helper" id="password-help">Use 8+ characters with uppercase, lowercase, number, and symbol.</span>}
                  {formMode === "login" && <button type="button" className="text-link forgot-password-link" onClick={openForgotPassword}>Forgot password?</button>}
                </FormField>
              )}
              {mode === "forgot" && (
                <>
                  {recoveryStep === "request" && (
                    <FormField name="identity" error={fieldErrors.identity}>
                      <input
                        name="identity"
                        placeholder="Registered email or mobile"
                        type="text"
                        autoComplete="username"
                        value={identity}
                        onChange={(event) => setIdentity(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.identity)}
                        aria-describedby="identity-error"
                      />
                    </FormField>
                  )}
                  {recoveryStep === "otp" && (
                    <FormField name="otp" error={fieldErrors.otp}>
                      <input
                        name="otp"
                        placeholder="Verification code"
                        type="text"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.otp)}
                        aria-describedby="otp-error"
                      />
                    </FormField>
                  )}
                  {recoveryStep === "password" && (
                    <>
                      <FormField name="newPassword" error={fieldErrors.newPassword}>
                        <div className="password-input-wrap">
                          <input
                            name="newPassword"
                            placeholder="New password"
                            type={showNewPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            aria-invalid={Boolean(fieldErrors.newPassword)}
                            aria-describedby="newPassword-error newPassword-help"
                          />
                          <button type="button" className="password-visibility-button" onClick={() => setShowNewPassword((value) => !value)} aria-label={showNewPassword ? "Hide password" : "Show password"}>
                            {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                        <span className="form-helper" id="newPassword-help">Use 8+ characters with uppercase, lowercase, number, and symbol.</span>
                      </FormField>
                      <FormField name="confirmPassword" error={fieldErrors.confirmPassword}>
                        <div className="password-input-wrap">
                          <input
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            aria-invalid={Boolean(fieldErrors.confirmPassword)}
                            aria-describedby="confirmPassword-error"
                          />
                          <button type="button" className="password-visibility-button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                            {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      </FormField>
                    </>
                  )}
                </>
              )}
              {formMode === "register" && registrationStep === "details" && (
                <label className={`consent-line ${fieldErrors.consent ? "invalid" : ""}`}>
                  <input name="consent" type="checkbox" aria-invalid={Boolean(fieldErrors.consent)} aria-describedby="consent-error" />
                  I agree to CarHub terms, privacy policy, and secure booking updates.
                  {fieldErrors.consent && <span className="field-error" id="consent-error">{fieldErrors.consent}</span>}
                </label>
              )}
              {error && <div className="error-box"><span>{error}</span></div>}
              {notice && <div className="notice-panel">{notice}</div>}
              <button className="primary-button auth-submit-button" type="submit" disabled={submitting}>
                {submitting
                  ? "Please wait..."
                  : mode === "forgot"
                    ? recoveryStep === "request"
                      ? "Send verification code"
                      : recoveryStep === "otp"
                        ? "Verify code"
                        : "Reset password"
                    : formMode === "register"
                      ? registrationStep === "verify" ? "Verify email and complete" : "Create account"
                      : "Sign in securely"}
              </button>
            </form>
          </>
        )}
      </motion.section>
    </div>
  );
}

function FormField({ name, error, children }: { name: string; error?: string; children: ReactNode }) {
  return (
    <label className="form-field">
      {children}
      {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
    </label>
  );
}

export function CustomerDashboard() {
  const [bookingTickets, setBookingTickets] = useState<BookingTicket[]>([]);
  const [customerMessage, setCustomerMessage] = useState("");
  const activeBookings = bookingTickets.filter((item) => item.status === "ASSIGNED" || item.status === "BOOKED");
  const nextTrip = activeBookings[0] ?? bookingTickets[0];

  async function loadCustomerWorkspace() {
    const bookingTicketData = await api.get<BookingTicket[]>("/tickets").catch(() => []);
    setBookingTickets(bookingTicketData);
  }

  useEffect(() => { void loadCustomerWorkspace(); }, []);

  async function verifyTicketCompletion(event: FormEvent<HTMLFormElement>, ticketId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.post<BookingTicket>(`/tickets/${ticketId}/verify-completion`, { otp: form.get("otp") });
      setCustomerMessage("Journey completion verified.");
      await loadCustomerWorkspace();
    } catch (exception) {
      setCustomerMessage(exception instanceof Error ? exception.message : "OTP verification failed.");
    }
  }

  async function submitTicketFeedback(event: FormEvent<HTMLFormElement>, ticketId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.post("/customer/feedback", {
        ticketId,
        packageRating: Number(form.get("packageRating")),
        providerRating: Number(form.get("providerRating")),
        supportRating: Number(form.get("supportRating")),
        comment: form.get("comment")
      });
      setCustomerMessage("Feedback submitted for admin review.");
      event.currentTarget.reset();
    } catch (exception) {
      setCustomerMessage(exception instanceof Error ? exception.message : "Feedback submit failed.");
    }
  }

  return (
    <DashboardShell title="Customer workspace" role="CUSTOMER">
      <section className="customer-workspace">
        <div className="customer-overview">
          <div className="customer-overview-copy">
            <span className="eyebrow"><TicketCheck size={16} />Trip command center</span>
            <h2>{nextTrip ? `Next pickup for ${nextTrip.destination}` : "Plan your next CarHub trip"}</h2>
            <p>{nextTrip ? `${nextTrip.packageName} is ${nextTrip.status.toLowerCase().replace("_", " ")} with pickup from ${nextTrip.pickupLocation ?? "your selected location"}.` : "Your bookings, provider details, pickup schedule, and vehicle information will appear here after checkout."}</p>
          </div>
          <div className="customer-overview-card">
            <span>Next pickup</span>
            <strong>{nextTrip?.pickupDate ?? "Not scheduled"}</strong>
            <small>{nextTrip?.pickupTime ? `${nextTrip.pickupTime} from ${nextTrip.pickupLocation ?? "pickup point"}` : "Book a package to generate a travel ticket."}</small>
          </div>
        </div>

        <div className="customer-grid">
          <div className="ops-panel customer-bookings-panel">
            <div className="panel-title-row">
              <div>
                <h3>Booked tickets</h3>
                <p className="muted">Provider, pickup, route, and vehicle details in one place.</p>
              </div>
              <Link className="outline-button" to="/packages">New trip<ArrowRight size={16} /></Link>
            </div>
            {customerMessage && <p className="journey-message">{customerMessage}</p>}
            {bookingTickets.length === 0 && (
              <div className="customer-empty-state">
                <TicketCheck size={30} />
                <strong>No confirmed bookings yet.</strong>
                <p className="muted">Explore packages and complete checkout to see tickets here.</p>
              </div>
            )}
            <div className="customer-ticket-list">
              {bookingTickets.map((ticket) => (
                <article className="customer-ticket-card" key={ticket.id}>
                  <div className="ticket-card-main">
                    <div>
                      <img className="ticket-card-logo" src="/carhub-logo.png" alt="CarHub" />
                      <span className={`status-pill ${ticket.status.toLowerCase()}`}>{ticket.status.replace("_", " ")}</span>
                      <h4>{ticket.packageName}</h4>
                      <p><MapPin size={15} />{ticket.destination}</p>
                    </div>
                    <strong>{ticket.ticketNumber}</strong>
                  </div>
                  <div className="ticket-detail-grid">
                    <div className="ticket-detail-item">
                      <span><CalendarDays size={15} />Pickup date</span>
                      <strong>{ticket.pickupDate ?? "Date pending"}</strong>
                    </div>
                    <div className="ticket-detail-item">
                      <span><Clock3 size={15} />Pickup time</span>
                      <strong>{ticket.pickupTime ?? "Time pending"}</strong>
                    </div>
                    <div className="ticket-detail-item">
                      <span><MapPin size={15} />Pickup</span>
                      <strong>{ticket.pickupLocation ?? "Pickup point pending"}</strong>
                    </div>
                    <div className="ticket-detail-item">
                      <span><Users size={15} />Travellers</span>
                      <strong>{ticket.travellersCount}</strong>
                    </div>
                    <div className="ticket-detail-item">
                      <span><ClipboardCheck size={15} />Car type</span>
                      <strong>{ticket.carType.replace("_", " ").toLowerCase()}</strong>
                    </div>
                    <div className="ticket-detail-item">
                      <span><MapPin size={15} />Route</span>
                      <strong>{ticket.route}</strong>
                    </div>
                  </div>
                  <div className="ticket-provider-row">
                    <div className="ticket-detail-item">
                      <span><ShieldCheck size={15} />Provider</span>
                      <strong>{ticket.providerBusinessName}</strong>
                    </div>
                    <div className="ticket-detail-item">
                      <span><Headphones size={15} />Contact</span>
                      <strong>{ticket.providerContactNumber}</strong>
                    </div>
                  </div>
                  <div className="ticket-vehicle-line">
                    <div>
                      <span>Vehicle</span>
                      <strong>{ticket.carDetails || [ticket.carModel, ticket.carNumber, ticket.carColor].filter(Boolean).join(" - ") || "Vehicle details pending"}</strong>
                    </div>
                    {ticket.specialRequests && (
                      <div>
                        <span>Special request</span>
                        <strong>{ticket.specialRequests}</strong>
                      </div>
                    )}
                  </div>
                  <div className="ticket-card-actions">
                    <button className="outline-button" type="button" onClick={() => void downloadTicketPdf(ticket.id, ticket.ticketNumber)}>
                      <Download size={16} />
                      PDF
                    </button>
                  </div>
                  <div className="journey-panel">
                    <strong>Journey tracking</strong>
                    <span>Status: {ticket.status.replace(/_/g, " ").toLowerCase()}</span>
                    {ticket.providerLatitude && ticket.providerLongitude ? (
                      <a className="text-link" href={`https://www.google.com/maps?q=${ticket.providerLatitude},${ticket.providerLongitude}`} target="_blank" rel="noreferrer">
                        Open provider GPS location
                      </a>
                    ) : (
                      <span>Provider GPS location will appear after journey starts.</span>
                    )}
                    {ticket.providerLocationUpdatedAt && <small>Last updated {new Date(ticket.providerLocationUpdatedAt).toLocaleString()}</small>}
                    {ticket.status === "COMPLETION_OTP_PENDING" && (
                      <form className="journey-inline-form" onSubmit={(event) => verifyTicketCompletion(event, ticket.id)}>
                        <input name="otp" placeholder="Enter completion OTP" inputMode="numeric" />
                        <button className="primary-button" type="submit">Verify completion</button>
                      </form>
                    )}
                    {ticket.status === "COMPLETED" && (
                      <form className="journey-feedback-form" onSubmit={(event) => submitTicketFeedback(event, ticket.id)}>
                        <select name="packageRating" defaultValue="5" aria-label="Package rating">
                          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>Package {rating}/5</option>)}
                        </select>
                        <select name="providerRating" defaultValue="5" aria-label="Provider rating">
                          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>Provider {rating}/5</option>)}
                        </select>
                        <select name="supportRating" defaultValue="5" aria-label="Support rating">
                          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>Support {rating}/5</option>)}
                        </select>
                        <textarea name="comment" placeholder="Share your journey experience" />
                        <button className="primary-button" type="submit">Submit feedback</button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

type ProviderSection = "overview" | "tickets" | "submit" | "packages" | "status";

export function ProviderDashboard() {
  const [bookingTickets, setBookingTickets] = useState<ProviderTicket[]>([]);
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [message, setMessage] = useState("");
  const [completionOtps, setCompletionOtps] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submittingPackage, setSubmittingPackage] = useState(false);
  const [activeSection, setActiveSection] = useState<ProviderSection>("overview");
  const [selectedManagePackageId, setSelectedManagePackageId] = useState<string | null>(null);
  const [savedPackageIds, setSavedPackageIds] = useState<Set<string>>(new Set());
  const [editingPackageIds, setEditingPackageIds] = useState<Set<string>>(new Set());
  const [cancelRequestPackageId, setCancelRequestPackageId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [selectedPackageDestination, setSelectedPackageDestination] = useState("");
  const [selectedManageDestinations, setSelectedManageDestinations] = useState<Record<string, string>>({});
  const [selectedPickupAvailabilityMode, setSelectedPickupAvailabilityMode] = useState("ALWAYS");
  const [selectedManagePickupModes, setSelectedManagePickupModes] = useState<Record<string, string>>({});
  const destinationOptions = useMemo(() => {
    return Array.from(new Set([...fallbackPackages.map((item) => item.place), ...packages.map((item) => item.destination)])).filter(Boolean).sort();
  }, [packages]);

  async function loadProviderWorkspace() {
    const [packageData, ticketData] = await Promise.all([
      api.get<ApiPackage[]>("/provider/packages").catch(() => []),
      api.get<ProviderTicket[]>("/provider/tickets").catch(() => [])
    ]);
    setPackages(packageData);
    setBookingTickets(ticketData);
  }

  useEffect(() => { void loadProviderWorkspace(); }, []);

  async function startTicketJourney(ticketId: string) {
    try {
      await api.post<ProviderTicket>(`/provider/tickets/${ticketId}/start`, {});
      setMessage("Journey started. GPS tracking is active when location is shared.");
      await updateTicketLocation(ticketId);
      await loadProviderWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Journey start failed.");
    }
  }

  async function updateTicketLocation(ticketId: string) {
    if (!navigator.geolocation) {
      setMessage("GPS is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await api.post<ProviderTicket>(`/provider/tickets/${ticketId}/location`, {
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude)
        });
        setMessage("Provider GPS location updated.");
        await loadProviderWorkspace();
      } catch (exception) {
        setMessage(exception instanceof Error ? exception.message : "Location update failed.");
      }
    }, () => setMessage("Location permission denied. Allow GPS access to track this journey."));
  }

  async function requestCompletionOtp(ticketId: string) {
    try {
      const response = await api.post<{ otp: string; message: string }>(`/provider/tickets/${ticketId}/completion-otp`, {});
      setCompletionOtps((current) => ({ ...current, [ticketId]: response.otp }));
      setMessage(response.message || "Completion OTP generated.");
      await loadProviderWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Completion OTP request failed.");
    }
  }

  useEffect(() => {
    if (activeSection !== "packages") return;
    const editablePackages = packages.filter((pack) =>
      pack.availabilityStatus !== "BOOKED" &&
      pack.availabilityStatus !== "AVAILABLE" &&
      pack.availabilityStatus !== "CANCELLATION_REQUESTED"
    );
    if (editablePackages.length === 0) {
      setSelectedManagePackageId(null);
      return;
    }
    setSelectedManagePackageId((current) => current && editablePackages.some((pack) => pack.id === current) ? current : editablePackages[0].id);
  }, [activeSection, packages]);

  async function submitPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setFieldErrors({});
    const form = new FormData(formElement);
    const raw = Object.fromEntries(form);
    const carPhotoFile = form.get("carPhotoUrl");
    const licenseFile = form.get("licenseDocumentUrl");
    const rcDocFile = form.get("rcDocumentUrl");
    raw.carPhotoUrl = carPhotoFile instanceof File && carPhotoFile.size > 0 ? carPhotoFile.name : "";
    raw.licenseDocumentUrl = licenseFile instanceof File && licenseFile.size > 0 ? licenseFile.name : "";
    raw.rcDocumentUrl = rcDocFile instanceof File && rcDocFile.size > 0 ? rcDocFile.name : "";
    const uploadErrors = getProviderUploadErrors(form, true, true);
    if (Object.keys(uploadErrors).length > 0) {
      setFieldErrors(uploadErrors);
      return;
    }
    const result = providerPackageSchema.safeParse(raw);
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }
    setSubmittingPackage(true);
    try {
      const destination = result.data.destination === "__custom" ? result.data.customDestination?.trim() : result.data.destination;
      const carPhotoUrl = carPhotoFile instanceof File && carPhotoFile.size > 0 ? await fileToDataUrl(carPhotoFile) : result.data.carPhotoUrl;
      const licenseDocumentUrl = licenseFile instanceof File && licenseFile.size > 0 ? await fileToDataUrl(licenseFile) : result.data.licenseDocumentUrl;
      const rcDocumentUrl = rcDocFile instanceof File && rcDocFile.size > 0 ? await fileToDataUrl(rcDocFile) : undefined;
      await api.post<ApiPackage>("/provider/packages", {
        ...result.data,
        destination,
        seatsAvailable: result.data.carType === "SIX_SEATER" ? 6 : 4,
        carPhotoUrl,
        licenseDocumentUrl,
        rcDocumentUrl
      });
      formElement.reset();
      setSelectedPackageDestination("");
      setSelectedPickupAvailabilityMode("ALWAYS");
      setMessage("Package submitted successfully. Waiting for admin approval before it goes live.");
      await loadProviderWorkspace();
    } catch (exception) {
      const apiFieldErrors = toProviderFieldErrors(exception);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      } else {
        setMessage(exception instanceof Error ? exception.message : "Package submit failed.");
      }
    } finally {
      setSubmittingPackage(false);
    }
  }

  async function updatePackageDetails(event: FormEvent<HTMLFormElement>, packageId: string) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form);
    const carPhotoFile = form.get("carPhotoUrl");
    const existingCarPhotoUrl = String(form.get("existingCarPhotoUrl") ?? "");
    const licenseFile = form.get("licenseDocumentUrl");
    const existingLicenseDocumentUrl = String(form.get("existingLicenseDocumentUrl") ?? "");
    const rcDocFile = form.get("rcDocumentUrl");
    const existingRcDocumentUrl = String(form.get("existingRcDocumentUrl") ?? "");
    raw.carPhotoUrl = carPhotoFile instanceof File && carPhotoFile.size > 0 ? carPhotoFile.name : existingCarPhotoUrl;
    raw.licenseDocumentUrl = licenseFile instanceof File && licenseFile.size > 0 ? licenseFile.name : existingLicenseDocumentUrl;
    raw.rcDocumentUrl = rcDocFile instanceof File && rcDocFile.size > 0 ? rcDocFile.name : existingRcDocumentUrl;
    const uploadErrors = getProviderUploadErrors(form, !existingCarPhotoUrl, !existingLicenseDocumentUrl);
    if (Object.keys(uploadErrors).length > 0) {
      setFieldErrors(uploadErrors);
      return;
    }
    const result = providerPackageSchema.safeParse(raw);
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }
    try {
      const destination = result.data.destination === "__custom" ? result.data.customDestination?.trim() : result.data.destination;
      const carPhotoUrl = carPhotoFile instanceof File && carPhotoFile.size > 0 ? await fileToDataUrl(carPhotoFile) : existingCarPhotoUrl;
      const licenseDocumentUrl = licenseFile instanceof File && licenseFile.size > 0 ? await fileToDataUrl(licenseFile) : existingLicenseDocumentUrl;
      const rcDocumentUrl = rcDocFile instanceof File && rcDocFile.size > 0 ? await fileToDataUrl(rcDocFile) : existingRcDocumentUrl;
      await api.put<ApiPackage>(`/provider/packages/${packageId}`, {
        ...result.data,
        destination,
        seatsAvailable: result.data.carType === "SIX_SEATER" ? 6 : 4,
        carPhotoUrl,
        licenseDocumentUrl,
        rcDocumentUrl
      });
      setSelectedManageDestinations((current) => ({ ...current, [packageId]: destination ?? "" }));
      setSavedPackageIds((prev) => new Set(prev).add(packageId));
      setEditingPackageIds((prev) => { const next = new Set(prev); next.delete(packageId); return next; });
      setMessage("Package updated successfully.");
      await loadProviderWorkspace();
    } catch (exception) {
      const apiFieldErrors = toProviderFieldErrors(exception);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      } else {
        setMessage(exception instanceof Error ? exception.message : "Package update failed.");
      }
    }
  }

  async function requestCancellation(packageId: string) {
    setSubmittingCancel(true);
    setMessage("");
    try {
      await api.post(`/provider/packages/${packageId}/cancel-request`, { reason: cancelReason });
      setMessage("Cancellation request submitted. Admin will review it.");
      setCancelRequestPackageId(null);
      setCancelReason("");
      await loadProviderWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Cancellation request failed.");
    } finally {
      setSubmittingCancel(false);
    }
  }

  const manageablePackages = packages.filter((pack) => pack.availabilityStatus !== "BOOKED");
  const visiblePackages = manageablePackages.filter((pack) =>
    pack.availabilityStatus !== "AVAILABLE" && pack.availabilityStatus !== "CANCELLATION_REQUESTED"
  );
  const livePackages = packages.filter((pack) => pack.availabilityStatus === "AVAILABLE").length;
  const pendingPackages = packages.filter((pack) => pack.availabilityStatus === "PENDING_ADMIN_REVIEW").length;
  const needsChangesPackages = packages.filter((pack) => pack.availabilityStatus === "CHANGES_REQUESTED").length;
  const selectedManagePackage = manageablePackages.find((pack) => pack.id === selectedManagePackageId) ?? null;
  const packageStatusLabel = (status?: string) => {
    if (status === "PENDING_ADMIN_REVIEW") return "Waiting for approval";
    if (status === "AVAILABLE") return "Live";
    if (status === "CANCELLATION_REQUESTED") return "Cancellation pending";
    if (status === "CHANGES_REQUESTED") return "Changes requested";
    if (status === "REJECTED_BY_COMPANY") return "Rejected";
    if (status === "BOOKED") return "Booked";
    return (status ?? "Pending").replace(/_/g, " ");
  };
  const packageUpdateMessage = (pack: ApiPackage) => {
    if (pack.reviewNotes?.trim()) return pack.reviewNotes.trim();
    if (pack.availabilityStatus === "PENDING_ADMIN_REVIEW") return "Your latest package update is waiting for admin approval.";
    if (pack.availabilityStatus === "CHANGES_REQUESTED") return "Admin requested changes. Update this package and submit it again.";
    if (pack.availabilityStatus === "AVAILABLE") return "Package approved and live. It has been removed from the edit queue.";
    if (pack.availabilityStatus === "BOOKED") return "This car has been booked and removed from editable packages.";
    return "";
  };
  const providerSections: Array<{ id: ProviderSection; label: string; description: string; count?: number; icon: ReactNode }> = [
    { id: "overview", label: "Overview", description: "", icon: <ClipboardCheck size={18} /> },
    { id: "tickets", label: "Tickets", description: "", count: bookingTickets.length, icon: <TicketCheck size={18} /> },
    { id: "submit", label: "Submit package", description: "", icon: <CarFront size={18} /> },
    { id: "packages", label: "Manage packages", description: "", count: visiblePackages.length, icon: <MapPin size={18} /> },
    { id: "status", label: "Status", description: "", count: pendingPackages + needsChangesPackages, icon: <ShieldCheck size={18} /> }
  ];
  const activeProviderSection = providerSections.find((section) => section.id === activeSection) ?? providerSections[0];

  return (
    <DashboardShell title="Provider workspace" role="PROVIDER">
      <div className="provider-workspace-shell provider-admin-shell">
        <aside className="provider-sidebar provider-admin-sidebar" aria-label="Provider workspace features">
          <div className="provider-sidebar-title">
            <span className="eyebrow">Provider panel</span>
            <strong>Workspace</strong>
            <small>{livePackages} live packages</small>
          </div>
          <nav className="provider-sidebar-nav provider-admin-nav">
            {providerSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? "active" : ""}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                <span className="provider-nav-icon">{section.icon}</span>
                <span className="provider-nav-copy">
                  <strong>{section.label}</strong>
                  <small>{section.description}</small>
                </span>
                {typeof section.count === "number" && <b>{section.count}</b>}
              </button>
            ))}
          </nav>
          <div className="provider-sidebar-note">
            <span>Admin review</span>
            <strong>{pendingPackages} pending</strong>
          </div>
        </aside>

        <section className="provider-workspace-main">
          <div className="provider-feature-header">
            <div>
              <span className="eyebrow">{activeProviderSection.label}</span>
              <h2>{activeSection === "submit" ? "Create provider package" : activeProviderSection.label}</h2>
              <p>{activeProviderSection.description}</p>
            </div>
            <button className="primary-button" type="button" onClick={() => setActiveSection("submit")}>Add package</button>
          </div>

          <div className="provider-summary-grid">
            <button type="button" className="provider-summary-card" onClick={() => setActiveSection("tickets")}>
              <span><TicketCheck size={18} />Tickets</span>
              <strong>{bookingTickets.length}</strong>
            </button>
            <button type="button" className="provider-summary-card" onClick={() => setActiveSection("packages")}>
              <span><MapPin size={18} />Live packages</span>
              <strong>{livePackages}</strong>
            </button>
            <button type="button" className="provider-summary-card" onClick={() => setActiveSection("status")}>
              <span><Clock3 size={18} />Pending review</span>
              <strong>{pendingPackages}</strong>
            </button>
            <button type="button" className="provider-summary-card" onClick={() => setActiveSection("packages")}>
              <span><ClipboardCheck size={18} />Needs changes</span>
              <strong>{needsChangesPackages}</strong>
            </button>
          </div>

          {activeSection === "overview" && (
            <div className="provider-section-stack">
              <div className="ops-panel provider-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Workspace overview</h3>
                    <p className="muted">Track tickets, package approvals, and vehicle details from one clean dashboard.</p>
                  </div>
                  <button className="primary-button" type="button" onClick={() => setActiveSection("submit")}>Add package</button>
                </div>
                <div className="provider-overview-grid">
                  <div>
                    <span>Latest ticket</span>
                    <strong>{bookingTickets[0]?.ticketNumber ?? "No tickets yet"}</strong>
                    <small>{bookingTickets[0]?.packageName ?? "Confirmed customer trips will appear here."}</small>
                  </div>
                  <div>
                    <span>Package status</span>
                    <strong>{livePackages} live</strong>
                    <small>{pendingPackages} waiting for admin review.</small>
                  </div>
                  <div>
                    <span>Action needed</span>
                    <strong>{needsChangesPackages}</strong>
                    <small>Packages with admin change requests.</small>
                  </div>
                </div>
              </div>
              <div className="ops-panel provider-panel">
                <div className="panel-title-row">
                  <div>
                    <h3>Recent packages</h3>
                    <p className="muted">Your latest submitted package records.</p>
                  </div>
                  <button className="outline-button" type="button" onClick={() => setActiveSection("packages")}>Manage</button>
                </div>
                {packages.length === 0 ? (
                  <p className="muted">No packages submitted yet.</p>
                ) : (
                  <div className="provider-table-list">
                    {packages.slice(0, 4).map((pack) => (
                      <div className="provider-table-row" key={pack.id}>
                        <strong>{pack.title}</strong>
                        <span>{pack.destination}</span>
                        <small>{packageStatusLabel(pack.availabilityStatus)}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "tickets" && (
            <div className="ops-panel provider-panel">
        <div className="panel-title-row">
          <div>
            <h3>Direct booking tickets</h3>
            <p className="muted">Confirmed customer pickups assigned to your provider account.</p>
          </div>
          <span className="status-pill booked">{bookingTickets.length} ticket{bookingTickets.length === 1 ? "" : "s"}</span>
        </div>
        {bookingTickets.length === 0 ? (
          <p className="muted">No direct booking tickets assigned yet.</p>
        ) : (
          <div className="provider-data-table provider-ticket-table">
            <div className="provider-data-row provider-data-head">
              <span>Ticket</span>
              <span>Pickup</span>
              <span>Customer ref</span>
              <span>Vehicle</span>
              <span>Status</span>
              <span>Journey</span>
            </div>
            {bookingTickets.map((ticket) => (
              <div className="provider-data-row" key={ticket.id}>
                <div>
                  <strong>{ticket.ticketNumber}</strong>
                  <small>{ticket.packageName}</small>
                  <small>{ticket.destination}</small>
                </div>
                <div>
                  <strong>{ticket.pickupDate ?? "Date pending"}</strong>
                  <small>{ticket.pickupTime ?? "Time pending"}</small>
                  <small>{ticket.pickupLocation ?? "Pickup point pending"}</small>
                </div>
                <div>
                  <strong>{ticket.maskedCustomerRef}</strong>
                  <small>{ticket.travellersCount} traveller{ticket.travellersCount === 1 ? "" : "s"}</small>
                </div>
                <div>
                  <strong>{[ticket.carNumber, ticket.carModel].filter(Boolean).join(" - ") || "Vehicle pending"}</strong>
                  <small>{ticket.carType.replace("_", " ").toLowerCase()}</small>
                </div>
                <div>
                  <small className="status-pill booked">{ticket.status.replace("_", " ").toLowerCase()}</small>
                  {ticket.specialRequests && <small>{ticket.specialRequests}</small>}
                </div>
                <div className="journey-actions">
                  {ticket.status === "ASSIGNED" || ticket.status === "BOOKED" ? <button className="outline-button" type="button" onClick={() => void startTicketJourney(ticket.id)}>Start journey</button> : null}
                  {ticket.status === "IN_PROGRESS" && <button className="outline-button" type="button" onClick={() => void updateTicketLocation(ticket.id)}>Update GPS</button>}
                  {ticket.status === "IN_PROGRESS" && <button className="primary-button" type="button" onClick={() => void requestCompletionOtp(ticket.id)}>Completion OTP</button>}
                  {completionOtps[ticket.id] && <strong className="journey-otp">OTP {completionOtps[ticket.id]}</strong>}
                  {ticket.providerLatitude && ticket.providerLongitude && <a className="text-link" href={`https://www.google.com/maps?q=${ticket.providerLatitude},${ticket.providerLongitude}`} target="_blank" rel="noreferrer">Map</a>}
                  {ticket.providerLocationUpdatedAt && <small>{new Date(ticket.providerLocationUpdatedAt).toLocaleString()}</small>}
                </div>
              </div>
            ))}
          </div>
        )}
            </div>
          )}

          {activeSection === "submit" && (
            <div className="ops-panel provider-panel">
        <div className="panel-title-row">
          <div>
            <h3>Submit package</h3>
            <p className="muted">Add destination, vehicle, licence, and availability details.</p>
          </div>
        </div>
        {message && <p className="trust-note">{message}</p>}
        <form className="compact-form package-proposal-form" onSubmit={submitPackage}>
          <div className="provider-form-sections">
            <section className="provider-form-section">
              <div className="section-kicker"><MapPin size={17} />Package data</div>
              <FormField name="destination" error={fieldErrors.destination}>
                <select
                  name="destination"
                  value={selectedPackageDestination}
                  onChange={(event) => setSelectedPackageDestination(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.destination)}
                  aria-describedby="destination-error"
                >
                  <option value="" disabled>Select destination</option>
                  {destinationOptions.map((destination) => <option key={destination} value={destination}>{destination}</option>)}
                  <option value="__custom">Destination not listed</option>
                </select>
              </FormField>
              {selectedPackageDestination === "__custom" && (
                <FormField name="customDestination" error={fieldErrors.customDestination}>
                  <input name="customDestination" placeholder="Type destination if not listed" aria-invalid={Boolean(fieldErrors.customDestination)} aria-describedby="customDestination-error" />
                </FormField>
              )}
              <FormField name="localPlaces" error={fieldErrors.localPlaces}>
                <textarea name="localPlaces" placeholder="Subplaces or local places covered manually" aria-invalid={Boolean(fieldErrors.localPlaces)} aria-describedby="localPlaces-error" />
              </FormField>
              <div className="pickup-schedule-box">
                <FormField name="pickupAvailabilityMode" error={fieldErrors.pickupAvailabilityMode}>
                  <select
                    name="pickupAvailabilityMode"
                    value={selectedPickupAvailabilityMode}
                    onChange={(event) => setSelectedPickupAvailabilityMode(event.target.value)}
                    aria-invalid={Boolean(fieldErrors.pickupAvailabilityMode)}
                    aria-describedby="pickupAvailabilityMode-error"
                  >
                    <option value="ALWAYS">Available 24/7</option>
                    <option value="SPECIFIC">Specific pickup hours</option>
                  </select>
                </FormField>
                {selectedPickupAvailabilityMode === "SPECIFIC" && (
                  <div className="pickup-time-window">
                    <FormField name="pickupStartTime" error={fieldErrors.pickupStartTime}>
                      <input name="pickupStartTime" type="time" aria-label="Pickup start time" aria-invalid={Boolean(fieldErrors.pickupStartTime)} aria-describedby="pickupStartTime-error" />
                    </FormField>
                    <FormField name="pickupEndTime" error={fieldErrors.pickupEndTime}>
                      <input name="pickupEndTime" type="time" aria-label="Pickup end time" aria-invalid={Boolean(fieldErrors.pickupEndTime)} aria-describedby="pickupEndTime-error" />
                    </FormField>
                  </div>
                )}
              </div>
            </section>

            <section className="provider-form-section">
              <div className="section-kicker"><CarFront size={17} />Car data</div>
              <FormField name="carType" error={fieldErrors.carType}>
                <select name="carType" defaultValue="FOUR_SEATER" aria-invalid={Boolean(fieldErrors.carType)} aria-describedby="carType-error">
                  <option value="FOUR_SEATER">4 seater</option>
                  <option value="SIX_SEATER">6 seater</option>
                </select>
              </FormField>
              <FormField name="carNumber" error={fieldErrors.carNumber}>
                <input name="carNumber" placeholder="Car number" aria-invalid={Boolean(fieldErrors.carNumber)} aria-describedby="carNumber-error" />
              </FormField>
              <FormField name="carModel" error={fieldErrors.carModel}>
                <input name="carModel" placeholder="Car name or model" aria-invalid={Boolean(fieldErrors.carModel)} aria-describedby="carModel-error" />
              </FormField>
              <FormField name="carPhotoUrl" error={fieldErrors.carPhotoUrl}>
                <input name="carPhotoUrl" type="file" accept="image/*" aria-invalid={Boolean(fieldErrors.carPhotoUrl)} aria-describedby="carPhotoUrl-error carPhotoUrl-help" />
                <span className="form-helper" id="carPhotoUrl-help">Upload clear car photo.</span>
              </FormField>
              <FormField name="pricePerKm" error={fieldErrors.pricePerKm}>
                <input name="pricePerKm" type="number" min="0.01" step="0.01" placeholder="Price per km (INR)" aria-invalid={Boolean(fieldErrors.pricePerKm)} aria-describedby="pricePerKm-error pricePerKm-help" />
                <span className="form-helper" id="pricePerKm-help">How much you charge per 1 kilometer (e.g. 12.50).</span>
              </FormField>
              <FormField name="rcNumber" error={fieldErrors.rcNumber}>
                <input name="rcNumber" placeholder="Vehicle RC number" aria-invalid={Boolean(fieldErrors.rcNumber)} aria-describedby="rcNumber-error" />
              </FormField>
              <FormField name="rcDocumentUrl" error={fieldErrors.rcDocumentUrl}>
                <input name="rcDocumentUrl" type="file" accept="image/*,application/pdf,.pdf" aria-invalid={Boolean(fieldErrors.rcDocumentUrl)} aria-describedby="rcDocumentUrl-error rcDocumentUrl-help" />
                <span className="form-helper" id="rcDocumentUrl-help">Upload vehicle RC document (photo or PDF).</span>
              </FormField>
            </section>

            <section className="provider-form-section">
              <div className="section-kicker"><IdCard size={17} />Driver details</div>
              <FormField name="licenseNumber" error={fieldErrors.licenseNumber}>
                <input name="licenseNumber" placeholder="Driving licence number" aria-invalid={Boolean(fieldErrors.licenseNumber)} aria-describedby="licenseNumber-error" />
              </FormField>
              <FormField name="licenseHolderName" error={fieldErrors.licenseHolderName}>
                <input name="licenseHolderName" placeholder="Licence holder name" aria-invalid={Boolean(fieldErrors.licenseHolderName)} aria-describedby="licenseHolderName-error" />
              </FormField>
              <FormField name="licenseDocumentUrl" error={fieldErrors.licenseDocumentUrl}>
                <input name="licenseDocumentUrl" type="file" accept="image/*,application/pdf,.pdf" aria-invalid={Boolean(fieldErrors.licenseDocumentUrl)} aria-describedby="licenseDocumentUrl-error licenseDocumentUrl-help" />
                <span className="form-helper" id="licenseDocumentUrl-help">Upload driving licence photo or PDF.</span>
              </FormField>
            </section>
          </div>
          <button className="primary-button" type="submit" disabled={submittingPackage}>
            {submittingPackage ? "Submitting..." : "Submit package"}
          </button>
        </form>
            </div>
          )}

          {activeSection === "packages" && (
            <div className="ops-panel provider-panel">
        <div className="panel-title-row">
          <div>
            <h3>Manage package details</h3>
            <p className="muted">{manageablePackages.length} package{manageablePackages.length === 1 ? "" : "s"} — live packages are read-only, others can be edited.</p>
          </div>
        </div>
        {manageablePackages.length === 0 && <p className="provider-inline-notice success">No packages to manage yet.</p>}
        {manageablePackages.length > 0 && (
          <div className="provider-data-table provider-package-table">
            <div className="provider-data-row provider-data-head provider-package-row">
              <span>Package</span>
              <span>Vehicle</span>
              <span>Pickup window</span>
              <span>Rate</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {manageablePackages.map((pack) => {
              const isLive = pack.availabilityStatus === "AVAILABLE" || pack.availabilityStatus === "CANCELLATION_REQUESTED";
              return (
                <div className={`provider-data-row provider-package-row ${selectedManagePackage?.id === pack.id ? "selected" : ""}${isLive ? " provider-row--live" : ""}`} key={pack.id}>
                  <div>
                    <strong>{pack.title}</strong>
                    <small>{pack.destination}</small>
                    {packageUpdateMessage(pack) && <small className="provider-row-note">{packageUpdateMessage(pack)}</small>}
                  </div>
                  <div>
                    <strong>{[pack.carNumber, pack.carModel].filter(Boolean).join(" - ") || "Vehicle pending"}</strong>
                    <small>{(pack.carType ?? "FOUR_SEATER").replace("_", " ").toLowerCase()}</small>
                  </div>
                  <div>
                    <strong>{pack.pickupAvailabilityMode === "SPECIFIC" ? `${pack.pickupStartTime ?? "--"} to ${pack.pickupEndTime ?? "--"}` : "Available 24/7"}</strong>
                    <small>{pack.localPlaces ?? pack.summary}</small>
                  </div>
                  <div>
                    <strong>{pack.pricePerKm ? `INR ${pack.pricePerKm}/km` : "Not set"}</strong>
                    <small>{pack.providerPayout ? `Payout INR ${pack.providerPayout}` : "Payout pending"}</small>
                  </div>
                  <div>
                    <small className={`status-pill ${(pack.availabilityStatus ?? "").toLowerCase().replace(/_/g, "-")}`}>
                      {packageStatusLabel(pack.availabilityStatus)}
                    </small>
                  </div>
                  {isLive ? (
                    pack.availabilityStatus === "CANCELLATION_REQUESTED" ? (
                      <span className="provider-row-action-note">Request pending</span>
                    ) : (
                      <button className="outline-button provider-row-action provider-row-action--danger" type="button" onClick={() => { setSelectedManagePackageId(pack.id); setCancelRequestPackageId(pack.id); }}>
                        Request cancellation
                      </button>
                    )
                  ) : (
                    <button className="outline-button provider-row-action" type="button" onClick={() => { setSelectedManagePackageId(pack.id); setCancelRequestPackageId(null); }}>
                      {savedPackageIds.has(pack.id) && !editingPackageIds.has(pack.id) ? "Edit again" : "Edit"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="proposal-grid">
          {selectedManagePackage && (() => {
              const pack = selectedManagePackage;
              const isLive = pack.availabilityStatus === "AVAILABLE" || pack.availabilityStatus === "CANCELLATION_REQUESTED";
              const isSaved = savedPackageIds.has(pack.id) && !editingPackageIds.has(pack.id);
              const selectedDestination = selectedManageDestinations[pack.id] ?? pack.destination;
              const selectedPickupMode = selectedManagePickupModes[pack.id] ?? pack.pickupAvailabilityMode ?? "ALWAYS";

              if (isLive) {
                return (
                  <div className="content-editor-card provider-selected-editor provider-live-panel" key={pack.id}>
                    <div className="provider-editor-heading">
                      <div>
                        <strong>{pack.title}</strong>
                        <small>{pack.destination} — <span className="provider-live-badge">Live</span></small>
                      </div>
                    </div>
                    <p className="provider-live-notice">This package is currently live and cannot be edited. If an emergency requires cancellation, submit a request to admin below.</p>
                    {pack.availabilityStatus === "CANCELLATION_REQUESTED" ? (
                      <div className="provider-inline-notice provider-cancel-pending">
                        <strong>Cancellation request already submitted.</strong>
                        <span>Admin will review and process your request shortly.</span>
                        {pack.reviewNotes && <small>{pack.reviewNotes}</small>}
                      </div>
                    ) : cancelRequestPackageId === pack.id ? (
                      <div className="provider-cancel-form">
                        <label className="provider-cancel-label">
                          Reason for cancellation <span className="provider-cancel-required">(required)</span>
                          <textarea
                            className="provider-cancel-textarea"
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            placeholder="Describe the emergency reason for cancelling this live package..."
                            rows={4}
                          />
                        </label>
                        <div className="provider-cancel-actions">
                          <button
                            type="button"
                            className="primary-button provider-cancel-submit"
                            disabled={submittingCancel || !cancelReason.trim()}
                            onClick={() => void requestCancellation(pack.id)}
                          >
                            {submittingCancel ? "Submitting..." : "Submit cancellation request"}
                          </button>
                          <button type="button" className="outline-button" onClick={() => { setCancelRequestPackageId(null); setCancelReason(""); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="outline-button provider-cancel-trigger" onClick={() => setCancelRequestPackageId(pack.id)}>
                        Request emergency cancellation
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <form className={`content-editor-card provider-selected-editor${isSaved ? " provider-editor--saved" : ""}`} key={pack.id} onSubmit={(event) => updatePackageDetails(event, pack.id)}>
                  {isSaved && (
                    <div className="provider-saved-banner">
                      <span className="provider-saved-icon">✓</span>
                      <span>Package updated successfully — sent for admin review.</span>
                      <button type="button" className="outline-button" onClick={() => setEditingPackageIds((prev) => new Set(prev).add(pack.id))}>Edit</button>
                    </div>
                  )}
                  <fieldset disabled={isSaved} style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>
                  <div className="provider-editor-heading">
                    <div>
                      <strong>Edit selected package</strong>
                      <small>{pack.destination} - {packageStatusLabel(pack.availabilityStatus)}</small>
                    </div>
                    <small>{pack.pricePerKm ? `INR ${pack.pricePerKm}/km` : "Rate not set"}{pack.providerPayout ? ` - Payout INR ${pack.providerPayout}` : ""}</small>
                  </div>
                  <div className="provider-editor-meta">
                    <span>Your rate: {pack.pricePerKm ? `INR ${pack.pricePerKm}/km` : "Not set"}</span>
                    <span>{pack.providerPayout ? `Payout INR ${pack.providerPayout}` : "Payout pending"}</span>
                  </div>
                  {packageUpdateMessage(pack) && <div className="provider-inline-notice">{packageUpdateMessage(pack)}</div>}
                  <div className="provider-form-sections manage-package-sections">
                    <section className="provider-form-section">
                      <div className="section-kicker"><MapPin size={17} />Package data</div>
                      <select
                        name="destination"
                        value={selectedDestination}
                        onChange={(event) => setSelectedManageDestinations((current) => ({ ...current, [pack.id]: event.target.value }))}
                      >
                        {destinationOptions.map((destination) => <option key={destination} value={destination}>{destination}</option>)}
                        <option value="__custom">Destination not listed</option>
                      </select>
                      {selectedDestination === "__custom" && <input name="customDestination" placeholder="Type destination if not listed" />}
                      <textarea name="localPlaces" defaultValue={pack.localPlaces ?? pack.summary} placeholder="Local places or subplaces" />
                      <div className="pickup-schedule-box">
                        <select
                          name="pickupAvailabilityMode"
                          value={selectedPickupMode}
                          onChange={(event) => setSelectedManagePickupModes((current) => ({ ...current, [pack.id]: event.target.value }))}
                        >
                          <option value="ALWAYS">Available 24/7</option>
                          <option value="SPECIFIC">Specific pickup hours</option>
                        </select>
                        {selectedPickupMode === "SPECIFIC" && (
                          <div className="pickup-time-window">
                            <input name="pickupStartTime" type="time" defaultValue={pack.pickupStartTime ?? ""} aria-label={`${pack.title} pickup start time`} />
                            <input name="pickupEndTime" type="time" defaultValue={pack.pickupEndTime ?? ""} aria-label={`${pack.title} pickup end time`} />
                          </div>
                        )}
                      </div>
                    </section>
                    <section className="provider-form-section">
                      <div className="section-kicker"><CarFront size={17} />Car data</div>
                      <select name="carType" defaultValue={pack.carType ?? "FOUR_SEATER"}>
                        <option value="FOUR_SEATER">4 seater</option>
                        <option value="SIX_SEATER">6 seater</option>
                      </select>
                      <input name="carNumber" defaultValue={pack.carNumber ?? ""} placeholder="Car number" />
                      <input name="carModel" defaultValue={pack.carModel ?? ""} placeholder="Car name or model" />
                      <input name="existingCarPhotoUrl" type="hidden" value={pack.carPhotoUrl ?? ""} />
                      <input name="carPhotoUrl" type="file" accept="image/*" aria-label={`${pack.title} car photo`} />
                      <span className="form-helper">{pack.carPhotoUrl ? "Car photo already uploaded. Choose a file to replace it." : "Upload clear car photo."}</span>
                      <input name="pricePerKm" type="number" min="0.01" step="0.01" defaultValue={pack.pricePerKm ?? ""} placeholder="Price per km (INR)" aria-label={`${pack.title} price per km`} />
                      <span className="form-helper">How much you charge per 1 kilometer.</span>
                      <input name="rcNumber" defaultValue={pack.rcNumber ?? ""} placeholder="Vehicle RC number" aria-label={`${pack.title} RC number`} />
                      <input name="existingRcDocumentUrl" type="hidden" value={pack.rcDocumentUrl ?? ""} />
                      <input name="rcDocumentUrl" type="file" accept="image/*,application/pdf,.pdf" aria-label={`${pack.title} RC document`} />
                      <span className="form-helper">{pack.rcDocumentUrl ? "RC document already uploaded. Choose a file to replace it." : "Upload vehicle RC document (photo or PDF)."}</span>
                    </section>
                    <section className="provider-form-section">
                      <div className="section-kicker"><IdCard size={17} />Driver details</div>
                      <input name="licenseNumber" defaultValue={pack.licenseNumber ?? ""} placeholder="Driving licence number" />
                      <input name="licenseHolderName" defaultValue={pack.licenseHolderName ?? ""} placeholder="Licence holder name" />
                      <input name="existingLicenseDocumentUrl" type="hidden" value={pack.licenseDocumentUrl ?? ""} />
                      <input name="licenseDocumentUrl" type="file" accept="image/*,application/pdf,.pdf" aria-label={`${pack.title} licence document`} />
                      <span className="form-helper">{pack.licenseDocumentUrl ? "Licence document already uploaded. Choose a file to replace it." : "Upload driving licence photo or PDF."}</span>
                    </section>
                  </div>
                  {!isSaved && <button className="primary-button" type="submit">Update package</button>}
                  </fieldset>
                </form>
              );
            })()}
        </div>
            </div>
          )}

          {activeSection === "status" && (
            <div className="ops-panel provider-panel">
              <div className="panel-title-row">
                <div>
                  <h3>Approval status</h3>
                  <p className="muted">Admin review decides when a package becomes visible to customers.</p>
                </div>
              </div>
              {packages.length === 0 ? (
                <p className="muted">Submit your first package to start admin review.</p>
              ) : (
                <div className="provider-data-table provider-status-table">
                  <div className="provider-data-row provider-data-head">
                    <span>Package</span>
                    <span>Destination</span>
                    <span>Review status</span>
                    <span>Admin note</span>
                  </div>
                  {packages.map((pack) => (
                    <div className="provider-data-row" key={pack.id}>
                      <div>
                        <strong>{pack.title}</strong>
                        <small>{[pack.carNumber, pack.carModel].filter(Boolean).join(" - ") || "Vehicle pending"}</small>
                      </div>
                      <span>{pack.destination}</span>
                      <div>
                        <small className={`status-pill ${(pack.availabilityStatus ?? "").toLowerCase().replace(/_/g, "-")}`}>
                          {packageStatusLabel(pack.availabilityStatus)}
                        </small>
                      </div>
                      <p className="provider-status-note">{packageUpdateMessage(pack) || "No admin note."}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function DashboardShell({ title, role, children }: { title: string; role: string; children: ReactNode }) {
  return (
    <div className={`page padded-page dashboard-page ${role === "PROVIDER" ? "provider-dashboard-page" : ""}`}>
      {role !== "PROVIDER" && (
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">{role}</span>
            <h1>{title}</h1>
          </div>
          <Link className="primary-button" to="/packages">Explore packages<ArrowRight size={17} /></Link>
        </div>
      )}
      <div className="metric-grid">{children}</div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <motion.article className={`metric-card ${tone}`} variants={fadeUp} initial="hidden" animate="visible">
      <span className="metric-icon">{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </motion.article>
  );
}

export function StaticPage({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ContentPage>(`/content/${slug}`)
      .then(setPage)
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="page padded-page">
      <section className="static-panel">
        <span className="eyebrow"><ShieldCheck size={17} />CarHub policy</span>
        <h1>{page?.title ?? fallbackTitle}</h1>
        {loading ? (
          <p>Loading published content...</p>
        ) : (
          <>
            <p className="lead-copy">{page?.summary ?? "This content is managed by CarHub admin."}</p>
            <p>{page?.body ?? "CarHub prioritizes fast bookings, verified provider visibility, clear ticketing, and accountable support."}</p>
            {(page?.contactEmail || page?.contactPhone || page?.supportHours) && (
              <div className="contact-lines">
                {page.contactEmail && <span>Email: {page.contactEmail}</span>}
                {page.contactPhone && <span>Phone: {page.contactPhone}</span>}
                {page.supportHours && <span>Hours: {page.supportHours}</span>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="page padded-page">
      <section className="static-panel">
        <h1>Page not found</h1>
        <Link className="primary-button" to="/">Return home</Link>
      </section>
    </div>
  );
}
