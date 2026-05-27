import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
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
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Crown,
  Download,
  Fuel,
  Headphones,
  Heart,
  Eye,
  EyeOff,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  MapPin,
  MapPinned,
  MessageSquare,
  Menu,
  Mountain,
  PackageCheck,
  Search,
  ShieldCheck,
  Share2,
  SlidersHorizontal,
  Star,
  SunMedium,
  TicketCheck,
  TrendingUp,
  Users,
  IdCard,
  Waves,
  X,
  Zap
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  rcNumber: z.string().trim().min(4, "RC number is required."),
  rcDocumentImage: z.string().trim().min(1, "RC document image is required.")
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
  rcNumber: z.string().trim().optional(),
  rcDocumentUrl: z.string().trim().optional(),
  pricePerKm: z.coerce.number().positive("Rate per km must be greater than 0.").optional()
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
const providerAppUrl = (import.meta.env.VITE_PROVIDER_APP_URL ?? "http://localhost:5175").replace(/\/$/, "");

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

function openProviderPortal(action: "login" | "register") {
  window.location.assign(`${providerAppUrl}/${action}`);
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
    destination: item.destination,
    distance_from_pune: formatDistanceFromPune(item.totalDistanceKm ?? item.distanceKm),
    travel_time: `${item.durationDays} day${item.durationDays !== 1 ? "s" : ""}`,
    durationDays: item.durationDays,
    startingPrice: item.startingPrice,
    currency: item.currency,
    highlights: item.summary,
    localPlaces: item.localPlaces,
    category: item.category,
    image: item.imageUrl,
    video: item.videoUrl,
    region: item.region,
    carType: item.carType,
    subPlaces: item.subPlaces,
    routeOrder: item.routeOrder,
    totalDistanceKm: item.totalDistanceKm
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
  const [items, setItems] = useState<PackageCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "unavailable">("api");

  useEffect(() => {
    api
      .get<ApiPackage[]>("/packages")
      .then((data) => {
        setItems(data.map(toCard));
        setSource("api");
      })
      .catch(() => {
        setItems([]);
        setSource("unavailable");
      })
      .finally(() => setLoading(false));
  }, []);

  return { items, loading, source };
}

const HOME_BENEFITS = [
  {
    title: "Verified trips",
    description: "Provider-backed routes with clear booking steps.",
    icon: ShieldCheck
  },
  {
    title: "Simple booking",
    description: "Choose, confirm, and get your ticket.",
    icon: TicketCheck
  },
  {
    title: "Travel support",
    description: "Help is easy to find when needed.",
    icon: Headphones
  }
] as const;

const HOME_CONFIDENCE_POINTS = [
  "Verified providers",
  "Clear routes",
  "Trip support"
] as const;

const HOME_STATS = [
  { value: "10", label: "Curated routes" },
  { value: "3", label: "Regions covered" },
  { value: "₹1,815", label: "Starting price" },
  { value: "Same-day", label: "Pickup available" }
] as const;

const REGION_CARDS = [
  { region: "Pune", desc: "Sinhagad, Lonavala, Mahabaleshwar & more", icon: Castle, color: "#fff0f1", accent: "#e50914" },
  { region: "Nashik", desc: "Sula Vineyards, Trimbakeshwar, Kalsubai", icon: Mountain, color: "#f0f4ff", accent: "#1a56db" },
  { region: "Shirdi", desc: "Sai Baba Temple, Shani Shingnapur, Nashik", icon: Star, color: "#fffbeb", accent: "#d97706" },
  { region: "Multi-Region", desc: "Pune–Nashik–Shirdi grand circuit", icon: MapPinned, color: "#f0fdf4", accent: "#16a34a" }
] as const;

function parseRouteStops(routeOrder: string): string[] {
  if (routeOrder.includes("→") || routeOrder.includes("->")) {
    return routeOrder.split(/→|->/).map((s) => s.trim()).filter(Boolean);
  }
  const lines = routeOrder.split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return routeOrder.split(",").map((s) => s.trim()).filter(Boolean);
}

function StarRatingInput({ name, defaultValue = 5 }: { name: string; defaultValue?: number }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(defaultValue);
  return (
    <div className="star-rating-input">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= (hovered || selected) ? "active" : ""}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => setSelected(n)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          <Star size={22} fill={n <= (hovered || selected) ? "currentColor" : "none"} />
        </button>
      ))}
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { items } = usePackages();
  const featuredItems = items.length > 0 ? items.slice(0, 6) : fallbackPackages.slice(0, 6);

  return (
    <div className="page customer-home-page">
      <section className="customer-home-hero">
        <div className="hero-media-wrapper">
          <video
            className="hero-video"
            autoPlay
            loop
            muted
            playsInline
            poster="/BG.png"
            src="/carhub-hero.mp4"
          />
          <div className="hero-overlay" aria-hidden="true"></div>
        </div>
        <motion.div
          className="customer-home-hero-inner"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.12 }
            }
          }}
        >
          <div className="customer-home-hero-copy">
            <motion.div className="eyebrow" variants={fadeUp}>
              <ShieldCheck size={18} />
              Curated departures from Pune
            </motion.div>
            <motion.h1 className="hero-title" variants={fadeUp}>
              Premium road trips from Pune.
            </motion.h1>
            <motion.p variants={fadeUp}>
              10 curated routes — Nashik, Shirdi &amp; Western Ghats. Fixed prices, verified cars, same-day pickup.
            </motion.p>
            <motion.div className="customer-home-hero-actions" variants={fadeUp}>
              <button className="primary-button large" onClick={() => navigate("/packages")}>
                Explore Packages
                <ArrowRight size={18} />
              </button>
              <button className="outline-button" onClick={() => navigate("/contact")}>Contact Support</button>
            </motion.div>
            <motion.div className="customer-home-trust-row" variants={fadeUp}>
              {HOME_CONFIDENCE_POINTS.map((item) => (
                <span key={item}>
                  <CheckCircle2 size={15} />
                  {item}
                </span>
              ))}
            </motion.div>
            <motion.div className="home-stats-bar" variants={fadeUp}>
              {HOME_STATS.map((stat) => (
                <div key={stat.label} className="home-stat-item">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="customer-home-feature-band">
        <div className="customer-home-section-heading">
          <span className="eyebrow">Why CarHub</span>
          <h2>Travel smarter from Pune.</h2>
          <p>Fixed prices, verified cars, and live tracking — no surprises.</p>
        </div>
        <div className="customer-home-feature-grid">
          {HOME_BENEFITS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                className="customer-home-feature-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                transition={{ delay: index * 0.06 }}
              >
                <span className="customer-home-feature-icon"><Icon size={18} /></span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="customer-home-regions-band">
        <div className="customer-home-section-heading">
          <span className="eyebrow">Where we go</span>
          <h2>Regions we cover.</h2>
          <p>Pick a region to explore curated routes departing from Pune.</p>
        </div>
        <div className="home-region-grid">
          {REGION_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.region}
                className="home-region-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                transition={{ delay: index * 0.07 }}
                onClick={() => navigate(`/packages?region=${encodeURIComponent(card.region)}`)}
              >
                <span className="home-region-icon">
                  <Icon size={20} />
                </span>
                <strong className="home-region-name">{card.region}</strong>
                <p className="home-region-desc">{card.desc}</p>
                <span className="home-region-cta">Explore <ArrowRight size={14} /></span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="customer-home-packages-band">
        <div className="customer-home-section-heading customer-home-section-heading-row">
          <div>
            <span className="eyebrow">Featured journeys</span>
            <h2>Featured routes.</h2>
          </div>
          <button className="ghost-button customer-home-section-link" onClick={() => navigate("/packages")}>
            View all packages
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="customer-home-package-grid">
          {featuredItems.map((item, index) => <PackageTile key={item.id} item={item} index={index} />)}
        </div>
      </section>

      <section className="customer-home-support-band">
        <div className="customer-home-support-copy">
          <span className="eyebrow">Travel support</span>
          <h2>Need help choosing?</h2>
          <p>Contact support for route, pickup, or booking questions.</p>
        </div>
        <div className="customer-home-support-actions">
          <button className="primary-button" onClick={() => navigate("/packages")}>
            Start exploring
            <ArrowRight size={16} />
          </button>
          <button className="outline-button" onClick={() => navigate("/contact")}>Talk to us</button>
        </div>
      </section>

      <section className="workflow-band customer-home-workflow-band">
        <div className="customer-home-section-heading customer-home-section-heading-compact">
          <span className="eyebrow">How CarHub works</span>
          <h2>Choose, book, travel.</h2>
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

const REGIONS = ["Pune", "Nashik", "Shirdi", "Multi-Region"] as const;

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, source } = usePackages();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get("category") ?? null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(() => searchParams.get("region") ?? null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(() => {
    const d = searchParams.get("duration");
    return d ? Number(d) : null;
  });
  const [selectedPrice, setSelectedPrice] = useState<string | null>(() => searchParams.get("price") ?? null);
  const [selectedCarType, setSelectedCarType] = useState<string | null>(() => searchParams.get("carType") ?? null);
  const [chipRail, setChipRail] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedRegion) params.region = selectedRegion;
    if (selectedDuration) params.duration = String(selectedDuration);
    if (selectedPrice) params.price = selectedPrice;
    if (selectedCarType) params.carType = selectedCarType;
    setSearchParams(params, { replace: true });
  }, [query, selectedCategory, selectedRegion, selectedDuration, selectedPrice, selectedCarType, setSearchParams]);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category))).filter(Boolean);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = matchesPackageQuery(item, query);
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesRegion = !selectedRegion || item.region === selectedRegion;
      const matchesDuration = !selectedDuration || (item.durationDays ?? 0) === selectedDuration;
      const matchesCarType = !selectedCarType || item.carType === selectedCarType;
      const price = item.startingPrice ?? 0;
      const matchesPrice = !selectedPrice || (
        selectedPrice === "under3k" ? price < 3000 :
        selectedPrice === "3k-6k" ? price >= 3000 && price <= 6000 :
        selectedPrice === "over6k" ? price > 6000 : true
      );
      return matchesSearch && matchesCategory && matchesRegion && matchesDuration && matchesCarType && matchesPrice;
    });
  }, [items, query, selectedCategory, selectedRegion, selectedDuration, selectedPrice, selectedCarType]);

  const quickFilters = [
    { label: "All Trips", value: null, icon: CalendarDays },
    { label: "Heritage", value: categories.find((item) => /heritage/i.test(item)) ?? "Heritage", icon: Castle },
    { label: "Spiritual", value: categories.find((item) => /spiritual/i.test(item)) ?? "Spiritual", icon: Star },
    { label: "Nature", value: categories.find((item) => /^nature$/i.test(item)) ?? "Nature", icon: Mountain },
    { label: "Weekend", value: categories.find((item) => /weekend/i.test(item)) ?? "Weekend", icon: SunMedium },
    { label: "Mixed", value: categories.find((item) => /mixed/i.test(item)) ?? "Mixed", icon: Waves },
    { label: "Family Tour", value: categories.find((item) => /nature|family/i.test(item)) ?? null, icon: Users },
    { label: "Couple Trip", value: categories.find((item) => /wine|scenic/i.test(item)) ?? null, icon: Heart },
    { label: "Grand Tour", value: categories.find((item) => /grand/i.test(item)) ?? "Grand Spiritual", icon: Crown }
  ];

  function scrollCategories() {
    chipRail?.scrollBy({ left: 220, behavior: "smooth" });
  }

  const hasActiveFilters = !!(query || selectedCategory || selectedRegion || selectedDuration || selectedPrice || selectedCarType);

  function clearFilters() {
    setQuery("");
    setSelectedCategory(null);
    setSelectedRegion(null);
    setSelectedDuration(null);
    setSelectedPrice(null);
    setSelectedCarType(null);
  }

  return (
    <div className="page padded-page explore-page">
      <div className="explore-video-layer" aria-hidden="true" />
      <section className="explore-hero">
        <div className="explore-hero-copy">
          <span className="eyebrow">Explore journeys</span>
          <h1>
            <span className="headline-line">Explore road trips</span>
            <span className="headline-line">from <span className="headline-accent">Pune.</span></span>
          </h1>
          <p className="explore-hero-tagline">Browse curated weekend, hill, coastal, and spiritual routes.</p>
          <div className="explore-hero-highlights">
            <span><ShieldCheck size={15} /> Verified routes</span>
            <span><TicketCheck size={15} /> Ticket booking</span>
            <span><Headphones size={15} /> Support</span>
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
      <section className="explore-browse-panel" aria-label="Search and filter packages">
        <div className="explore-panel-top">
          <div className="search-box explore-search">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search destinations, trips or themes..."
              aria-label="Search packages"
            />
            {query && (
              <button
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>
        <div className="region-filter-tabs" role="tablist" aria-label="Filter by region">
          <button
            type="button"
            role="tab"
            className={`region-tab ${!selectedRegion ? "active" : ""}`}
            aria-selected={!selectedRegion}
            onClick={() => setSelectedRegion(null)}
          >
            All
          </button>
          {REGIONS.map((region) => (
            <button
              type="button"
              role="tab"
              key={region}
              className={`region-tab ${selectedRegion === region ? "active" : ""}`}
              aria-selected={selectedRegion === region}
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </button>
          ))}
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
                  data-filter={filter.label.toLowerCase().replace(/\s+/g, "-")}
                  aria-pressed={active}
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

        <div className="explore-filter-pills-row">
          <div className="explore-filter-group">
            <span className="explore-filter-label"><Clock3 size={13} />Duration</span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                className={`explore-filter-pill ${selectedDuration === d ? "active" : ""}`}
                onClick={() => setSelectedDuration(selectedDuration === d ? null : d)}
              >
                {d} Day{d > 1 ? "s" : ""}
              </button>
            ))}
          </div>
          <div className="explore-filter-group">
            <span className="explore-filter-label"><TrendingUp size={13} />Price</span>
            {[
              { label: "Under ₹3K", value: "under3k" },
              { label: "₹3K–₹6K", value: "3k-6k" },
              { label: "₹6K+", value: "over6k" }
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                className={`explore-filter-pill ${selectedPrice === p.value ? "active" : ""}`}
                onClick={() => setSelectedPrice(selectedPrice === p.value ? null : p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="explore-filter-group">
            <span className="explore-filter-label"><CarFront size={13} />Car type</span>
            {[
              { label: "4-Seater", value: "FOUR_SEATER" },
              { label: "6-Seater", value: "SIX_SEATER" }
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                className={`explore-filter-pill ${selectedCarType === c.value ? "active" : ""}`}
                onClick={() => setSelectedCarType(selectedCarType === c.value ? null : c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button type="button" className="explore-clear-all-btn" onClick={clearFilters}>
              <X size={14} />Clear all
            </button>
          )}
        </div>
      </section>
      {source === "unavailable" && (
        <div className="notice-panel">
          Packages are temporarily unavailable. Please try again after the server is back online.
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
          <section className="explore-listing" aria-labelledby="explore-results-heading">
            <div className="explore-listing-header">
              <div>
                <span className="eyebrow">Available packages</span>
                <h2 id="explore-results-heading">
                  {filteredItems.length} trip{filteredItems.length === 1 ? "" : "s"} available
                </h2>
                <p className="explore-listing-copy">Pick a route and view details.</p>
              </div>
              <div className="explore-results-actions">
                <div className="explore-results-count">
                  <SlidersHorizontal size={16} />
                  <span>{filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}</span>
                </div>
                {hasActiveFilters && (
                  <button className="explore-reset-button" type="button" onClick={clearFilters}>
                    <X size={13} />Clear filters
                  </button>
                )}
              </div>
            </div>
            <div className="explore-package-grid">
              {filteredItems.map((item, index) => (
                <ExplorePackageCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatPackagePrice(item: PackageCard) {
  if (!item.startingPrice) return "Price on request";
  const currency = item.currency === "INR" || !item.currency ? "INR" : item.currency;
  return `From ${currency} ${item.startingPrice.toLocaleString("en-IN")}`;
}

function getPackageRating(item: PackageCard, index: number) {
  const seed = `${item.id}-${item.place}`.split("").reduce((total, char) => total + char.charCodeAt(0), index * 17);
  return (4.4 + (seed % 6) / 10).toFixed(1);
}

function ExplorePackageCard({ item, index }: { item: PackageCard; index: number }) {
  const rating = getPackageRating(item, index);
  const stopCount = item.subPlaces ? item.subPlaces.split(",").filter(Boolean).length : item.localPlaces ? item.localPlaces.split(",").filter(Boolean).length : 0;

  return (
    <motion.article
      className="explore-package-card"
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ delay: Math.min(index * 0.035, 0.24) }}
    >
      <Link className="explore-package-media" to={`/packages/${item.id}`} aria-label={`View ${item.place}`}>
        {item.video ? (
          <video src={item.video} autoPlay loop muted playsInline aria-label={item.place} />
        ) : (
          <img src={item.image} alt={item.place} loading="lazy" />
        )}
        <span className="explore-rating-badge" aria-label={`${rating} rating`}>
          <Star size={14} fill="currentColor" />
          {rating}
        </span>
      </Link>
      <div className="explore-package-content">
        <div className="explore-package-topline">
          {item.region && <span className="region-badge-sm">{item.region}</span>}
          <span className="explore-package-badge"><TicketCheck size={13} />{item.category}</span>
        </div>
        <div className="explore-package-title-row">
          <div>
            <span className="explore-package-kicker">
              <MapPin size={13} />
              {item.destination ?? item.place}
            </span>
            <h3>{item.place}</h3>
          </div>
          <strong className="explore-package-price">{formatPackagePrice(item)}</strong>
        </div>
        <p className="package-route-description">{item.highlights}</p>
        {item.subPlaces && (
          <p className="explore-subplaces-preview">
            <MapPin size={12} />
            {item.subPlaces.split(",").slice(0, 3).map(p => p.trim()).join(" / ")}
            {item.subPlaces.split(",").length > 3 && ` +${item.subPlaces.split(",").length - 3} more`}
          </p>
        )}
        <div className="explore-package-meta">
          <span><Clock3 size={13} />{item.travel_time}</span>
          {stopCount > 0 && <span><MapPin size={13} />{stopCount} stops</span>}
          {item.carType && (
            <span><CarFront size={13} />{item.carType === "SIX_SEATER" ? "6-Seater" : "4-Seater"}</span>
          )}
        </div>
        <div className="explore-package-actions">
          <Link className="primary-button" to={`/packages/${item.id}`}>
            View details
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

function PackageTile({ item, index }: { item: PackageCard; index: number }) {
  const navigate = useNavigate();
  const [isZoomed, setIsZoomed] = useState(false);
  const rating = getPackageRating(item, index);
  const subplacePreview = item.subPlaces ?? item.localPlaces;

  return (
    <>
      <motion.article className="customer-home-package-card" initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: index * 0.08 }}>
        <div
          className="customer-home-package-media"
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
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img src={item.image} alt={item.place} />
          )}
          <span className="customer-home-package-rating">
            <Star size={13} fill="currentColor" />
            {rating}
          </span>
        </div>
        <div className="customer-home-package-body" onClick={() => navigate(`/packages/${item.id}`)} style={{ cursor: "pointer" }}>
          <div className="customer-home-package-header">
            <span className="customer-home-package-tag">{item.category}</span>
            <span className="customer-home-package-time"><Clock3 size={14} /> {item.travel_time}</span>
          </div>
          <h3>{item.place}</h3>
          <p className="customer-home-package-route"><MapPin size={15} /> {item.distance_from_pune} from Pune</p>
          <strong className="customer-home-package-highlight">{item.highlights}</strong>
          {subplacePreview && <p className="customer-home-package-subplaces">{subplacePreview}</p>}
          <div className="customer-home-package-footer">
            <span>Verified route</span>
            <Link className="text-link" to={`/packages/${item.id}`}>View details</Link>
          </div>
        </div>
      </motion.article>

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
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setUnavailable(false);
    api.get<ApiPackage>(`/packages/${id}`)
      .then((data) => setPack(toCard(data)))
      .catch(() => {
        setPack(null);
        setUnavailable(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const selected = pack ?? items.find((item) => item.id === id) ?? null;

  if (loading) {
    return (
      <div className="page padded-page">
        <PackageSkeletonGrid />
      </div>
    );
  }

  if (unavailable || !selected) {
    return (
      <div className="page padded-page">
        <div className="empty-state">
          <TicketCheck size={34} />
          <h2>This package is no longer available.</h2>
          <p>It may already be booked or waiting for admin approval before going live again.</p>
          <button className="primary-button" onClick={() => navigate("/packages")}>View available packages</button>
        </div>
      </div>
    );
  }

  const routeStops = selected.routeOrder ? parseRouteStops(selected.routeOrder) : [];
  const priceDisplay = selected.startingPrice
    ? `₹${selected.startingPrice.toLocaleString("en-IN")}`
    : "Price on request";

  return (
    <div className="page padded-page">
      <section className="detail-hero">
        {selected.video ? (
          <video src={selected.video} autoPlay loop muted playsInline aria-label={selected.place} />
        ) : (
          <img src={selected.image} alt={selected.place} />
        )}
        <div className="detail-panel">
          <div className="detail-panel-badges">
            {selected.region && <span className="region-badge-detail">{selected.region}</span>}
            <span className="eyebrow">{selected.category}</span>
          </div>
          <h1>{selected.place}</h1>

          <div className="detail-stat-pills">
            <span className="detail-stat-pill"><MapPin size={14} />{selected.distance_from_pune}</span>
            <span className="detail-stat-pill"><Clock3 size={14} />{selected.travel_time}</span>
            {selected.carType && (
              <span className="detail-stat-pill"><CarFront size={14} />{selected.carType === "SIX_SEATER" ? "6-Seater SUV" : "4-Seater"}</span>
            )}
            <span className="detail-stat-pill"><LifeBuoy size={14} />Support included</span>
          </div>

          <p className="detail-summary">{selected.highlights}. Departing from Pune.</p>

          <div className="detail-price-block">
            <span className="detail-price-label">Package price</span>
            <strong className="detail-price-value">{priceDisplay}</strong>
          </div>

          {selected.subPlaces && (
            <div className="detail-subplaces">
              <h3>Places covered</h3>
              <div className="subplaces-list">
                {selected.subPlaces.split(",").map((place) => (
                  <span key={place.trim()} className="subplace-chip">
                    <MapPin size={11} />{place.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {routeStops.length > 0 && (
            <div className="detail-timeline">
              <h3>Your itinerary</h3>
              <div className="timeline-list">
                {routeStops.map((stop, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-node">
                      <div className="timeline-dot" />
                      {i < routeStops.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-content">
                      <strong>{stop}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-includes-grid">
            <div className="detail-includes-block">
              <h3>Included in price</h3>
              <ul className="detail-includes-list">
                <li><CheckCircle2 size={14} />Driver</li>
                <li><Fuel size={14} />Fuel charges</li>
                <li><ShieldCheck size={14} />Toll &amp; parking</li>
              </ul>
            </div>
            <div className="detail-includes-block">
              <h3>What to bring</h3>
              <ul className="detail-includes-list bring">
                <li><Zap size={14} />Water &amp; snacks</li>
                <li><IdCard size={14} />ID proof</li>
                <li><ShieldCheck size={14} />Comfortable shoes</li>
              </ul>
            </div>
          </div>

          {user?.role === "CUSTOMER" ? (
            <button
              className="primary-button large detail-book-btn"
              onClick={() => navigate(`/booking/${selected.id}`)}
            >
              Book Now — {priceDisplay}
              <ArrowRight size={18} />
            </button>
          ) : (
            <div className="detail-login-prompt">
              <LockKeyhole size={18} />
              <div>
                <strong>Sign in to book this trip</strong>
                <p>Create an account or log in to confirm your seat.</p>
              </div>
              <Link
                className="primary-button"
                to="/login"
                state={{ returnTo: `/booking/${selected.id}` }}
              >
                Sign in <ArrowRight size={16} />
              </Link>
            </div>
          )}
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
  const [packageLoading, setPackageLoading] = useState(true);
  const [packageUnavailable, setPackageUnavailable] = useState(false);
  const [travellersCount, setTravellersCount] = useState(1);
  const [carType, setCarType] = useState<CarType>("FOUR_SEATER");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!packageId) return;
    setPackageLoading(true);
    setPackageUnavailable(false);
    api.get<ApiPackage>(`/packages/${packageId}`)
      .then((data) => {
        setPack(data);
        const type = (data.carType === "SIX_SEATER" ? "SIX_SEATER" : "FOUR_SEATER") as CarType;
        setCarType(type);
        const maxSeats = type === "SIX_SEATER" ? 6 : 4;
        setTravellersCount((prev) => Math.min(prev, maxSeats));
      })
      .catch(() => {
        setPack(null);
        setPackageUnavailable(true);
      })
      .finally(() => setPackageLoading(false));
  }, [packageId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!packageId) return;
    setError("");
    setFieldErrors({});
    if (!pack) {
      setError("This package is no longer available.");
      return;
    }
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
      {packageLoading ? (
        <PackageSkeletonGrid />
      ) : packageUnavailable ? (
        <div className="empty-state">
          <TicketCheck size={34} />
          <h2>This package is no longer available.</h2>
          <p>It may already be booked or waiting for admin approval before going live again.</p>
          <button className="primary-button" onClick={() => navigate("/packages")}>View available packages</button>
        </div>
      ) : (
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
      )}
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
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/customer";
  const authState = location.state as { role?: "CUSTOMER" | "PROVIDER"; formMode?: "login" | "register"; returnTo?: string } | null;
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "PROVIDER" | null>(authState?.role ?? null);
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
    setSelectedRole(mode === "forgot" ? null : (authState?.role ?? null));
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
  }, [mode, authState?.formMode, authState?.role]);

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
    setSelectedRole(null);
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
            <button type="button" className="role-button provider" onClick={() => openProviderPortal(mode === "register" ? "register" : "login")}>
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
                <button type="button" className="text-link" onClick={resetSelection}>Back to options</button>
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
                      {selectedRole === "PROVIDER" && (
                        <>
                          <FormField name="rcNumber" error={fieldErrors.rcNumber}>
                            <input name="rcNumber" placeholder="RC number" aria-invalid={Boolean(fieldErrors.rcNumber)} aria-describedby="rcNumber-error" />
                          </FormField>
                          <FormField name="rcDocumentImage" error={fieldErrors.rcDocumentImage}>
                            <input name="rcDocumentImage" type="file" accept="application/pdf,.pdf" aria-invalid={Boolean(fieldErrors.rcDocumentImage)} aria-describedby="rcDocumentImage-error rcDocumentImage-help" />
                            <span className="form-helper" id="rcDocumentImage-help">Upload RC document as PDF only.</span>
                          </FormField>
                        </>
                      )}
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
  const [activeSection, setActiveSection] = useState<"overview" | "bookings" | "tracking" | "verify" | "feedback">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

  const activeBookings = bookingTickets.filter((t) => ["ASSIGNED", "BOOKED", "IN_PROGRESS"].includes(t.status));
  const pendingOtpTickets = bookingTickets.filter((t) => t.status === "COMPLETION_OTP_PENDING");
  const completedTickets = bookingTickets.filter((t) => t.status === "COMPLETED");
  const nextTrip = activeBookings[0] ?? bookingTickets[0];

  async function loadCustomerWorkspace() {
    const data = await api.get<BookingTicket[]>("/tickets").catch(() => []);
    setBookingTickets(data);
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
      setCustomerMessage("Feedback submitted. Thank you!");
      event.currentTarget.reset();
    } catch (exception) {
      setCustomerMessage(exception instanceof Error ? exception.message : "Feedback submit failed.");
    }
  }

  function toggleTicket(id: string) {
    setExpandedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const customerSections = [
    { id: "overview"  as const, label: "Overview",      desc: "Your next trip at a glance.",          badge: 0,                        icon: <LayoutDashboard size={18} /> },
    { id: "bookings"  as const, label: "My Bookings",   desc: "All your confirmed tickets.",          badge: bookingTickets.length,    icon: <TicketCheck size={18} /> },
    { id: "tracking"  as const, label: "Track Journey", desc: "Live status and GPS for active trips.", badge: activeBookings.length,    icon: <MapPin size={18} /> },
    { id: "verify"    as const, label: "Verify Trip",   desc: "Enter OTP to complete your journey.",  badge: pendingOtpTickets.length, icon: <ShieldCheck size={18} /> },
    { id: "feedback"  as const, label: "Rate & Review", desc: "Share your trip experience.",          badge: completedTickets.length,  icon: <Star size={18} /> },
  ];
  const currentSection = customerSections.find((s) => s.id === activeSection) ?? customerSections[0];

  function renderOverview() {
    return (
      <div className="cust-section-view">
        <div className="cust-next-trip-card">
          <div className="cust-next-trip-copy">
            <span className="eyebrow"><TicketCheck size={15} />Trip command center</span>
            <h2>{nextTrip ? `Next pickup for ${nextTrip.destination}` : "Plan your next CarHub trip"}</h2>
            <p className="muted">{nextTrip
              ? `${nextTrip.packageName} is ${nextTrip.status.toLowerCase().replace(/_/g, " ")} — pickup from ${nextTrip.pickupLocation ?? "your selected location"}.`
              : "Your bookings, provider details, pickup schedule, and vehicle information will appear here after checkout."}</p>
          </div>
          <div className="cust-next-trip-meta">
            <span>Next pickup</span>
            <strong>{nextTrip?.pickupDate ?? "Not scheduled"}</strong>
            <small>{nextTrip?.pickupTime ? `${nextTrip.pickupTime} · ${nextTrip.pickupLocation ?? "pickup point"}` : "Book a package to generate a travel ticket."}</small>
          </div>
        </div>
        <div className="cust-stats-row">
          <div className="cust-stat-card">
            <span>Total bookings</span>
            <strong>{bookingTickets.length}</strong>
          </div>
          <div className="cust-stat-card accent-blue">
            <span>Active trips</span>
            <strong>{activeBookings.length}</strong>
          </div>
          <div className="cust-stat-card accent-green">
            <span>Completed</span>
            <strong>{completedTickets.length}</strong>
          </div>
          {pendingOtpTickets.length > 0 && (
            <div className="cust-stat-card accent-red">
              <span>Needs verification</span>
              <strong>{pendingOtpTickets.length}</strong>
            </div>
          )}
        </div>
        {bookingTickets.length === 0 && (
          <div className="customer-empty-state">
            <TicketCheck size={30} />
            <strong>No confirmed bookings yet.</strong>
            <p className="muted">Explore packages and complete checkout to see tickets here.</p>
            <Link className="primary-button" to="/packages">Explore packages<ArrowRight size={16} /></Link>
          </div>
        )}
      </div>
    );
  }

  function renderBookings() {
    if (bookingTickets.length === 0) {
      return (
        <div className="customer-empty-state">
          <TicketCheck size={30} />
          <strong>No confirmed bookings yet.</strong>
          <p className="muted">Explore packages and complete checkout to see your tickets here.</p>
          <Link className="primary-button" to="/packages">Explore packages<ArrowRight size={16} /></Link>
        </div>
      );
    }
    return (
      <div className="cust-ticket-list">
        {bookingTickets.map((ticket) => {
          const expanded = expandedTickets.has(ticket.id);
          return (
            <div className="cust-ticket-accordion" key={ticket.id}>
              <button className="cust-ticket-row" type="button" onClick={() => toggleTicket(ticket.id)} aria-expanded={expanded}>
                <span className={`status-pill ${ticket.status.toLowerCase()}`}>{ticket.status.replace(/_/g, " ")}</span>
                <div className="cust-ticket-row-info">
                  <strong>{ticket.packageName}</strong>
                  <span><MapPin size={13} />{ticket.destination}</span>
                </div>
                <span className="cust-ticket-row-meta">
                  <span><CalendarDays size={13} />{ticket.pickupDate ?? "Date pending"}</span>
                  <span className="cust-ticket-num">{ticket.ticketNumber}</span>
                </span>
                {expanded ? <ChevronDown size={17} className="cust-chevron" /> : <ChevronRight size={17} className="cust-chevron" />}
              </button>
              {expanded && (
                <div className="cust-ticket-detail">
                  <div className="ticket-detail-grid">
                    <div className="ticket-detail-item"><span><Clock3 size={14} />Pickup time</span><strong>{ticket.pickupTime ?? "Pending"}</strong></div>
                    <div className="ticket-detail-item"><span><MapPin size={14} />Pickup point</span><strong>{ticket.pickupLocation ?? "Pending"}</strong></div>
                    <div className="ticket-detail-item"><span><Users size={14} />Travellers</span><strong>{ticket.travellersCount}</strong></div>
                    <div className="ticket-detail-item"><span><ClipboardCheck size={14} />Car type</span><strong>{ticket.carType.replace("_", " ").toLowerCase()}</strong></div>
                    <div className="ticket-detail-item"><span><MapPin size={14} />Route</span><strong>{ticket.route}</strong></div>
                    <div className="ticket-detail-item"><span><ShieldCheck size={14} />Provider</span><strong>{ticket.providerBusinessName}</strong></div>
                    <div className="ticket-detail-item"><span><Headphones size={14} />Contact</span><strong>{ticket.providerContactNumber}</strong></div>
                    <div className="ticket-detail-item"><span><CarFront size={14} />Vehicle</span><strong>{ticket.carDetails || [ticket.carModel, ticket.carNumber, ticket.carColor].filter(Boolean).join(" · ") || "Pending"}</strong></div>
                  </div>
                  {ticket.specialRequests && (
                    <p className="cust-special-req"><strong>Special request:</strong> {ticket.specialRequests}</p>
                  )}
                  <div className="cust-ticket-actions">
                    <button className="outline-button" type="button" onClick={() => void downloadTicketPdf(ticket.id, ticket.ticketNumber)}>
                      <Download size={15} />Download PDF
                    </button>
                    <a
                      className="outline-button"
                      href={`https://wa.me/?text=${encodeURIComponent(`My CarHub trip: ${ticket.packageName} on ${ticket.pickupDate ?? "TBD"} from ${ticket.pickupLocation ?? "pickup point"}. Ticket: ${ticket.ticketNumber}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageSquare size={15} />Share via WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderTracking() {
    const trackableTickets = bookingTickets.filter((t) => t.status !== "COMPLETED");
    if (trackableTickets.length === 0) {
      return (
        <div className="customer-empty-state">
          <MapPin size={30} />
          <strong>No active trips to track.</strong>
          <p className="muted">Journey tracking will appear here once a trip is assigned and started.</p>
        </div>
      );
    }
    return (
      <div className="cust-section-view">
        {trackableTickets.map((ticket) => (
          <div className="ops-panel cust-tracking-card" key={ticket.id}>
            <div className="cust-card-header">
              <div>
                <h4>{ticket.packageName}</h4>
                <p className="muted"><MapPin size={14} />{ticket.destination}</p>
              </div>
              <span className={`status-pill ${ticket.status.toLowerCase()}`}>{ticket.status.replace(/_/g, " ")}</span>
            </div>
            <div className="ticket-detail-grid">
              <div className="ticket-detail-item"><span><CalendarDays size={14} />Pickup date</span><strong>{ticket.pickupDate ?? "Pending"}</strong></div>
              <div className="ticket-detail-item"><span><Clock3 size={14} />Pickup time</span><strong>{ticket.pickupTime ?? "Pending"}</strong></div>
              <div className="ticket-detail-item"><span><ShieldCheck size={14} />Provider</span><strong>{ticket.providerBusinessName}</strong></div>
              <div className="ticket-detail-item"><span><Headphones size={14} />Contact</span><strong>{ticket.providerContactNumber}</strong></div>
            </div>
            {ticket.providerLatitude && ticket.providerLongitude
              ? <a className="text-link cust-gps-link" href={`https://www.google.com/maps?q=${ticket.providerLatitude},${ticket.providerLongitude}`} target="_blank" rel="noreferrer"><MapPin size={15} />Open provider live location</a>
              : <p className="muted cust-gps-pending">Provider GPS location will appear once the journey starts.</p>}
            {ticket.providerLocationUpdatedAt && <small className="muted">Last updated {new Date(ticket.providerLocationUpdatedAt).toLocaleString()}</small>}
          </div>
        ))}
      </div>
    );
  }

  function renderVerify() {
    if (pendingOtpTickets.length === 0) {
      return (
        <div className="customer-empty-state">
          <ShieldCheck size={30} />
          <strong>No trips awaiting verification.</strong>
          <p className="muted">When your provider completes a journey, you'll enter an OTP here to confirm completion.</p>
        </div>
      );
    }
    return (
      <div className="cust-section-view">
        {pendingOtpTickets.map((ticket) => (
          <div className="ops-panel cust-verify-card" key={ticket.id}>
            <div className="cust-card-header">
              <div>
                <h4>{ticket.packageName}</h4>
                <p className="muted"><MapPin size={14} />{ticket.destination}</p>
              </div>
              <span className="status-pill completion_otp_pending">OTP PENDING</span>
            </div>
            <p className="muted cust-verify-hint">Your provider has completed the journey. Enter the OTP they shared with you to confirm trip completion.</p>
            <form className="cust-otp-form" onSubmit={(e) => verifyTicketCompletion(e, ticket.id)}>
              <input name="otp" placeholder="Enter completion OTP" inputMode="numeric" maxLength={6} required />
              <button className="primary-button" type="submit"><ShieldCheck size={16} />Verify &amp; Complete</button>
            </form>
            {customerMessage && <p className="journey-message">{customerMessage}</p>}
          </div>
        ))}
      </div>
    );
  }

  function renderFeedback() {
    if (completedTickets.length === 0) {
      return (
        <div className="customer-empty-state">
          <Star size={30} />
          <strong>No completed trips yet.</strong>
          <p className="muted">After a journey is verified as complete, you can rate your experience here.</p>
        </div>
      );
    }
    return (
      <div className="cust-section-view">
        {completedTickets.map((ticket) => (
          <div className="ops-panel cust-feedback-card" key={ticket.id}>
            <div className="cust-card-header">
              <div>
                <h4>{ticket.packageName}</h4>
                <p className="muted"><MapPin size={14} />{ticket.destination}</p>
              </div>
              <span className="status-pill completed">COMPLETED</span>
            </div>
            <form className="cust-feedback-form" onSubmit={(e) => submitTicketFeedback(e, ticket.id)}>
              <div className="cust-ratings-row">
                <div className="cust-rating-label">
                  <span>Package</span>
                  <StarRatingInput name="packageRating" defaultValue={5} />
                </div>
                <div className="cust-rating-label">
                  <span>Provider</span>
                  <StarRatingInput name="providerRating" defaultValue={5} />
                </div>
                <div className="cust-rating-label">
                  <span>Support</span>
                  <StarRatingInput name="supportRating" defaultValue={5} />
                </div>
              </div>
              <textarea name="comment" placeholder="Share your journey experience…" rows={3} />
              <button className="primary-button" type="submit"><Star size={16} />Submit feedback</button>
            </form>
            {customerMessage && <p className="journey-message">{customerMessage}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="page customer-workspace-page">
      <aside className={`customer-sidebar${sidebarOpen ? " open" : ""}`} aria-label="Customer sections">
        <div className="customer-sidebar-head">
          <div>
            <strong>My Dashboard</strong>
            <small>Trip management</small>
          </div>
          <button className="icon-button customer-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="customer-nav">
          {customerSections.map((section) => (
            <button
              key={section.id}
              className={section.id === activeSection ? "active" : ""}
              type="button"
              onClick={() => { setActiveSection(section.id); setSidebarOpen(false); }}
              aria-current={section.id === activeSection ? "page" : undefined}
            >
              <span className="customer-nav-icon">{section.icon}</span>
              <span><strong>{section.label}</strong></span>
              {section.badge > 0 && <b>{section.badge}</b>}
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <button className="customer-sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="customer-main">
        <div className="customer-mobilebar">
          <button className="icon-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={19} />
          </button>
          <strong>{currentSection.label}</strong>
        </div>

        <div className="customer-workspace-heading">
          <div>
            <span className="eyebrow">CUSTOMER</span>
            <h1>{currentSection.label}</h1>
            <p className="muted">{currentSection.desc}</p>
          </div>
          <Link className="primary-button" to="/packages">Explore packages<ArrowRight size={17} /></Link>
        </div>

        {customerMessage && activeSection !== "verify" && activeSection !== "feedback" && (
          <div className="notice-panel">{customerMessage}</div>
        )}

        <div className="customer-section-view">
          {activeSection === "overview"  ? renderOverview()
            : activeSection === "bookings"  ? renderBookings()
            : activeSection === "tracking"  ? renderTracking()
            : activeSection === "verify"    ? renderVerify()
            : renderFeedback()}
        </div>
      </main>
    </div>
  );
}

export function ProviderDashboard() {
  const [activeSection, setActiveSection] = useState<"tickets" | "submit" | "manage">("tickets");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingTickets, setBookingTickets] = useState<ProviderTicket[]>([]);
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [message, setMessage] = useState("");
  const [completionOtps, setCompletionOtps] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submittingPackage, setSubmittingPackage] = useState(false);
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
      setMessage("Journey started.");
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
      await api.post<ProviderTicket>(`/provider/tickets/${ticketId}/location`, {
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude)
      });
      setMessage("GPS location updated.");
      await loadProviderWorkspace();
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

  async function submitPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setFieldErrors({});
    const form = new FormData(formElement);
    const raw = Object.fromEntries(form);
    const carPhotoFile = form.get("carPhotoUrl");
    const licenseFile = form.get("licenseDocumentUrl");
    const rcFile = form.get("rcDocumentUrl");
    raw.carPhotoUrl = carPhotoFile instanceof File && carPhotoFile.size > 0 ? carPhotoFile.name : "";
    raw.licenseDocumentUrl = licenseFile instanceof File && licenseFile.size > 0 ? licenseFile.name : "";
    raw.rcDocumentUrl = rcFile instanceof File && rcFile.size > 0 ? rcFile.name : "";
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
      const rcDocumentUrl = rcFile instanceof File && rcFile.size > 0 ? await fileToDataUrl(rcFile) : (result.data.rcDocumentUrl ?? undefined);
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
      setMessage("Car details and pickup availability are live for customers.");
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

  async function repostPackage(packageId: string) {
    setMessage("");
    try {
      await api.post<ApiPackage>(`/provider/packages/${packageId}/repost`, undefined);
      setMessage("Package reposted successfully and is pending admin review.");
      await loadProviderWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Repost failed. Please try again.");
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
    const rcFile = form.get("rcDocumentUrl");
    const existingRcDocumentUrl = String(form.get("existingRcDocumentUrl") ?? "");
    raw.carPhotoUrl = carPhotoFile instanceof File && carPhotoFile.size > 0 ? carPhotoFile.name : existingCarPhotoUrl;
    raw.licenseDocumentUrl = licenseFile instanceof File && licenseFile.size > 0 ? licenseFile.name : existingLicenseDocumentUrl;
    raw.rcDocumentUrl = rcFile instanceof File && rcFile.size > 0 ? rcFile.name : existingRcDocumentUrl;
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
      const rcDocumentUrl = rcFile instanceof File && rcFile.size > 0 ? await fileToDataUrl(rcFile) : (existingRcDocumentUrl || undefined);
      await api.put<ApiPackage>(`/provider/packages/${packageId}`, {
        ...result.data,
        destination,
        seatsAvailable: result.data.carType === "SIX_SEATER" ? 6 : 4,
        carPhotoUrl,
        licenseDocumentUrl,
        rcDocumentUrl
      });
      setSelectedManageDestinations((current) => ({ ...current, [packageId]: destination ?? "" }));
      setMessage("Package vehicle and travel details updated for admin review.");
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

  const providerSections = [
    { id: "tickets" as const, label: "My tickets",      description: "Confirmed customer pickups assigned to you.", count: bookingTickets.length, icon: <TicketCheck size={18} /> },
    { id: "submit"  as const, label: "Submit package",  description: "Add destination, vehicle and availability.",  count: 0,                     icon: <PackageCheck size={18} /> },
    { id: "manage"  as const, label: "Manage packages", description: "Update your submitted package details.",      count: packages.length,       icon: <ClipboardCheck size={18} /> },
  ];
  const currentProviderSection = providerSections.find((s) => s.id === activeSection) ?? providerSections[0];

  function renderTicketsPanel() {
    return (
      <div className="ops-panel provider-panel">
        <div className="panel-title-row">
          <div>
            <h3>Direct booking tickets</h3>
            <p className="muted">Confirmed customer pickups assigned to your provider account.</p>
          </div>
          <span className="status-pill booked">{bookingTickets.length} ticket{bookingTickets.length === 1 ? "" : "s"}</span>
        </div>
        {bookingTickets.length === 0 && <p className="muted">No direct booking tickets assigned yet.</p>}
        {bookingTickets.map((ticket) => (
          <div className="provider-ticket-card" key={ticket.id}>
            <div>
              <strong>{ticket.ticketNumber}</strong>
              <h4>{ticket.packageName}</h4>
              <p><MapPin size={15} />{ticket.destination}</p>
            </div>
            <div className="provider-ticket-grid">
              <span><CalendarDays size={15} />{ticket.pickupDate ?? "Date pending"}</span>
              <span><Clock3 size={15} />{ticket.pickupTime ?? "Time pending"}</span>
              <span><Users size={15} />{ticket.travellersCount} travellers</span>
              <span><ClipboardCheck size={15} />{ticket.carType.replace("_", " ").toLowerCase()}</span>
            </div>
            <small>Customer ref: {ticket.maskedCustomerRef}</small>
            <small>Pickup: {ticket.pickupLocation ?? "Pickup point pending"}</small>
            <small>Vehicle: {[ticket.carNumber, ticket.carModel].filter(Boolean).join(" - ") || "Vehicle details pending"}</small>
            {ticket.specialRequests && <small>Notes: {ticket.specialRequests}</small>}
            <div className="journey-actions">
              {ticket.status === "ASSIGNED" || ticket.status === "BOOKED" ? <button className="outline-button" type="button" onClick={() => void startTicketJourney(ticket.id)}>Start journey</button> : null}
              {ticket.status === "IN_PROGRESS" && <button className="outline-button" type="button" onClick={() => void updateTicketLocation(ticket.id)}>Update GPS</button>}
              {ticket.status === "IN_PROGRESS" && <button className="primary-button" type="button" onClick={() => void requestCompletionOtp(ticket.id)}>Completion OTP</button>}
              {completionOtps[ticket.id] && <strong className="journey-otp">OTP {completionOtps[ticket.id]}</strong>}
              {ticket.providerLatitude && ticket.providerLongitude && <a className="text-link" href={`https://www.google.com/maps?q=${ticket.providerLatitude},${ticket.providerLongitude}`} target="_blank" rel="noreferrer">Map</a>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSubmitPanel() {
    return (
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
            </section>
            <section className="provider-form-section">
              <div className="section-kicker"><IdCard size={17} />Driver &amp; RC details</div>
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
              <FormField name="rcNumber" error={fieldErrors.rcNumber}>
                <input name="rcNumber" placeholder="RC number (optional)" aria-invalid={Boolean(fieldErrors.rcNumber)} aria-describedby="rcNumber-error" />
              </FormField>
              <FormField name="rcDocumentUrl" error={fieldErrors.rcDocumentUrl}>
                <input name="rcDocumentUrl" type="file" accept="image/*,application/pdf,.pdf" aria-invalid={Boolean(fieldErrors.rcDocumentUrl)} aria-describedby="rcDocumentUrl-error rcDocumentUrl-help" />
                <span className="form-helper" id="rcDocumentUrl-help">Upload RC document (optional).</span>
              </FormField>
              <FormField name="pricePerKm" error={fieldErrors.pricePerKm}>
                <input name="pricePerKm" type="number" min="0.01" step="0.01" placeholder="Your rate per km (INR)" aria-invalid={Boolean(fieldErrors.pricePerKm)} aria-describedby="pricePerKm-error pricePerKm-help" />
                <span className="form-helper" id="pricePerKm-help">Admin sets final price. Your rate helps calculate payout.</span>
              </FormField>
            </section>
          </div>
          <button className="primary-button" type="submit" disabled={submittingPackage}>
            {submittingPackage ? "Submitting..." : "Submit package"}
          </button>
        </form>
      </div>
    );
  }

  function renderManagePanel() {
    return (
      <div className="ops-panel provider-panel">
        <div className="panel-title-row">
          <div>
            <h3>Manage package details</h3>
            <p className="muted">{packages.length} package{packages.length === 1 ? "" : "s"} submitted.</p>
          </div>
        </div>
        {packages.length === 0 && <p className="muted">No packages submitted yet.</p>}
        <div className="proposal-grid">
          {packages.map((pack) => {
            const selectedDestination = selectedManageDestinations[pack.id] ?? pack.destination;
            const selectedPickupMode = selectedManagePickupModes[pack.id] ?? pack.pickupAvailabilityMode ?? "ALWAYS";
            return (
              <form className="content-editor-card" key={pack.id} onSubmit={(event) => updatePackageDetails(event, pack.id)}>
                <strong>{pack.title}</strong>
                <small>{pack.destination} · {(pack.availabilityStatus ?? "PENDING").replace(/_/g, " ")}</small>
                <small>Payout: {pack.providerPayout ? `INR ${pack.providerPayout}` : "Admin price pending"}{pack.pricePerKm ? ` (${pack.pricePerKm}/km)` : ""}</small>
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
                    <span className="form-helper">{pack.carPhotoUrl ? "Car photo uploaded. Choose to replace." : "Upload clear car photo."}</span>
                  </section>
                  <section className="provider-form-section">
                    <div className="section-kicker"><IdCard size={17} />Driver &amp; RC details</div>
                    <input name="licenseNumber" defaultValue={pack.licenseNumber ?? ""} placeholder="Driving licence number" />
                    <input name="licenseHolderName" defaultValue={pack.licenseHolderName ?? ""} placeholder="Licence holder name" />
                    <input name="existingLicenseDocumentUrl" type="hidden" value={pack.licenseDocumentUrl ?? ""} />
                    <input name="licenseDocumentUrl" type="file" accept="image/*,application/pdf,.pdf" aria-label={`${pack.title} licence document`} />
                    <span className="form-helper">{pack.licenseDocumentUrl ? "Licence uploaded. Choose to replace." : "Upload driving licence photo or PDF."}</span>
                    <input name="rcNumber" defaultValue={pack.rcNumber ?? ""} placeholder="RC number (optional)" />
                    <input name="existingRcDocumentUrl" type="hidden" value={pack.rcDocumentUrl ?? ""} />
                    <input name="rcDocumentUrl" type="file" accept="image/*,application/pdf,.pdf" aria-label={`${pack.title} RC document`} />
                    <span className="form-helper">{pack.rcDocumentUrl ? "RC uploaded. Choose to replace." : "Upload RC document (optional)."}</span>
                    <input name="pricePerKm" type="number" min="0.01" step="0.01" defaultValue={pack.pricePerKm ?? ""} placeholder="Your rate per km (INR)" aria-label={`${pack.title} rate per km`} />
                  </section>
                </div>
                {pack.reviewNotes && <small className="review-note">{pack.reviewNotes}</small>}
                {pack.repostedFromId && <small className="repost-badge">Reposted from a completed package</small>}
                {pack.availabilityStatus === "BOOKED" ? (
                  <div className="repost-action-block">
                    <p className="trust-note">This package has been successfully completed. You can repost it to make it available again.</p>
                    <button className="primary-button" type="button" onClick={() => void repostPackage(pack.id)}>Repost package</button>
                  </div>
                ) : (
                  <button className="primary-button" type="submit">Update package</button>
                )}
              </form>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="page provider-workspace-page">
      <aside className={`provider-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Provider sections">
        <div className="provider-sidebar-head">
          <div>
            <strong>Provider portal</strong>
            <small>Operations menu</small>
          </div>
          <button className="icon-button provider-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="provider-nav">
          {providerSections.map((section) => (
            <button
              key={section.id}
              className={section.id === activeSection ? "active" : ""}
              type="button"
              onClick={() => { setActiveSection(section.id); setSidebarOpen(false); }}
              aria-current={section.id === activeSection ? "page" : undefined}
            >
              <span className="provider-nav-icon">{section.icon}</span>
              <span><strong>{section.label}</strong></span>
              <b>{section.count}</b>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <button className="provider-sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <main className="provider-main">
        <div className="provider-mobilebar">
          <button className="icon-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open provider menu">
            <Menu size={19} />
          </button>
          <strong>{currentProviderSection.label}</strong>
        </div>

        <div className="provider-workspace-heading">
          <div>
            <span className="eyebrow">PROVIDER</span>
            <h1>{currentProviderSection.label}</h1>
            <p className="muted">{currentProviderSection.description}</p>
          </div>
          <Link className="primary-button" to="/packages">Explore packages<ArrowRight size={17} /></Link>
        </div>

        {message && <div className="notice-panel provider-message">{message}</div>}

        <div className="provider-section-view">
          {activeSection === "submit" ? renderSubmitPanel() : activeSection === "manage" ? renderManagePanel() : renderTicketsPanel()}
        </div>
      </main>
    </div>
  );
}

function DashboardShell({ title, role, children }: { title: string; role: string; children: ReactNode }) {
  return (
    <div className="page padded-page dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">{role}</span>
          <h1>{title}</h1>
        </div>
        <Link className="primary-button" to="/packages">Explore packages<ArrowRight size={17} /></Link>
      </div>
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
