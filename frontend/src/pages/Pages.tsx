import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LifeBuoy,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TicketCheck
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { packages as fallbackPackages, workflow } from "../data/mockData";
import { api } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { matchesPackageQuery } from "../utils/packageSearch";
import {
  ApiPackage,
  ApiRequest,
  ContentPage,
  FeedbackItem,
  PackageCard,
  ProviderAssignment,
  RequestStatus,
  SupportTicket
} from "../types";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

const requestSchema = z.object({
  destination: z.string().min(3, "Destination is required"),
  currentLocation: z.string().min(3, "Current location is required"),
  travelers: z.coerce.number().min(1, "At least one traveler is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budget: z.string().min(1, "Budget range is required"),
  tripType: z.string().min(1, "Trip type is required"),
  emergencyContact: z.string().min(8, "Emergency contact is required")
});

const mobilePattern = /^(\+?\d{1,3}[-\s]?)?[6-9]\d{9}$|^\+?[1-9]\d{7,14}$/;

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  mobile: z.string().trim().regex(mobilePattern, "Enter a valid mobile number."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/\d/, "Password must include a number.")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character."),
  city: z.string().trim().min(2, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  country: z.string().trim().min(2, "Country is required."),
  consent: z.boolean().refine(Boolean, "Consent is required to create an account.")
});

const forgotSchema = z.object({
  identity: z.string().trim().min(3, "Enter your registered email or mobile number.")
});

const providerPackageSchema = z.object({
  title: z.string().trim().min(4, "Package title is required."),
  destination: z.string().trim().min(3, "Destination is required."),
  category: z.string().trim().min(3, "Category is required."),
  summary: z.string().trim().min(20, "Summary must explain the package clearly."),
  description: z.string().trim().min(40, "Description must include enough execution detail."),
  startingPrice: z.coerce.number().min(1, "Starting price is required."),
  currency: z.string().trim().length(3, "Currency must be a 3-letter code."),
  durationDays: z.coerce.number().min(1, "Duration must be at least 1 day.").max(60, "Duration is too long."),
  imageUrl: z.string().trim().url("Enter a valid image URL.").optional().or(z.literal(""))
});

type FieldErrors = Record<string, string>;

function getFieldErrors(error: z.ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
    return errors;
  }, {});
}

function toCard(item: ApiPackage): PackageCard {
  return {
    id: item.id,
    title: item.title,
    destination: item.destination,
    category: item.category,
    duration: `${item.durationDays} days`,
    price: `From ${item.currency} ${Number(item.startingPrice).toLocaleString("en-IN")}`,
    image: item.imageUrl,
    trust: item.providerBusinessName ? `Approved provider: ${item.providerBusinessName}` : "Company reviewed request flow",
    accent: item.summary
  };
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
        <div className="hero-media" aria-hidden="true" />
        <motion.div className="hero-content" initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.55 }}>
          <div className="eyebrow">
            <ShieldCheck size={18} />
            Company-reviewed travel requests
          </div>
          <h1 className="hero-title">Company-approved travel packages with trusted support.</h1>
          <p>Browse curated trips reviewed by CarHub.</p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={() => navigate("/packages")}>
              Explore Packages
              <ArrowRight size={18} />
            </button>
            <button className="glass-button" onClick={() => navigate("/contact")}>Talk to Support</button>
          </div>
          <div className="trust-grid">
            {["Admin approved", "Verified partners", "Travel support"].map((item) => (
              <span key={item}>
                <CheckCircle2 size={16} />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <span className="eyebrow">Featured journeys</span>
          <h2>Curated packages reviewed by CarHub.</h2>
        </div>
        <div className="package-grid">
          {items.slice(0, 4).map((item, index) => <PackageTile key={item.id} item={item} index={index} />)}
        </div>
      </section>

      <section className="workflow-band">
        <div>
          <span className="eyebrow">How CarHub protects customers</span>
          <h2>Company review comes first.</h2>
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
  const filteredItems = useMemo(() => {
    return items.filter((item) => matchesPackageQuery(item, query));
  }, [items, query]);

  return (
    <div className="page padded-page">
      <div className="toolbar">
        <div>
          <span className="eyebrow">Explore</span>
          <h1>Explore approved packages.</h1>
        </div>
        
      </div>
      <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destinations, themes, or cities" aria-label="Search packages" />
          <button className="icon-button" aria-label="Filter packages"><SlidersHorizontal size={18} /></button>
        </div>
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
      <div className="package-grid">
        {!loading && filteredItems.map((item, index) => <PackageTile key={item.id} item={item} index={index} />)}
      </div>
    </div>
  );
}

function PackageTile({ item, index }: { item: PackageCard; index: number }) {
  return (
    <motion.article className="package-card" initial="hidden" animate="visible" whileHover={{ y: -8 }} variants={fadeUp} transition={{ delay: index * 0.08 }}>
      <img src={item.image} alt={item.title} />
      <div className="package-body">
        <div className="card-meta">
          <span>{item.category}</span>
          <span>{item.duration}</span>
        </div>
        <h3>{item.title}</h3>
        <p><MapPin size={15} />{item.destination}</p>
        <div className="package-footer">
          <strong>{item.price}</strong>
          <Link className="text-link" to={`/packages/${item.id}`}>Details</Link>
        </div>
        <div className="trust-note"><ShieldCheck size={15} />{item.trust}</div>
      </div>
    </motion.article>
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
        <img src={selected.image} alt={selected.title} />
        <div className="detail-panel">
          <span className="eyebrow">{selected.category}</span>
          <h1>{selected.title}</h1>
          <p>{selected.accent}. Reviewed by CarHub before execution.</p>
          <div className="detail-facts">
            <span><CalendarDays size={17} />{selected.duration}</span>
            <span><TicketCheck size={17} />{selected.price}</span>
            <span><LifeBuoy size={17} />Support visible</span>
          </div>
          <button className="primary-button large" onClick={() => navigate(`/request/${selected.id}`)}>
            Request Package
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" | "forgot" }) {
  const { login, register, loginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/customer/requests";
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      if (mode === "forgot") {
        const result = forgotSchema.safeParse({ identity: String(form.get("identity") ?? "") });
        if (!result.success) {
          setFieldErrors(getFieldErrors(result.error));
          return;
        }
        setNotice("Password recovery is ready for email/SMS provider integration. For now, use a seeded demo account or contact support.");
        return;
      }
      if (mode === "register") {
        const result = registerSchema.safeParse({
          fullName: String(form.get("fullName") ?? ""),
          mobile: String(form.get("mobile") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          city: String(form.get("city") ?? ""),
          state: String(form.get("state") ?? ""),
          country: String(form.get("country") ?? ""),
          consent: form.get("consent") === "on"
        });
        if (!result.success) {
          setFieldErrors(getFieldErrors(result.error));
          return;
        }
        await register({
          fullName: result.data.fullName,
          email: result.data.email,
          mobile: result.data.mobile,
          password: result.data.password,
          city: result.data.city,
          state: result.data.state,
          country: result.data.country,
          preferredTravelType: "Family holiday",
          emergencyContactName: "Emergency Contact",
          emergencyContactMobile: result.data.mobile,
          consentTerms: true,
          consentPrivacy: true,
          consentControlledDataSharing: true
        });
      } else {
        const result = loginSchema.safeParse({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? "")
        });
        if (!result.success) {
          setFieldErrors(getFieldErrors(result.error));
          return;
        }
        await login(result.data.email, result.data.password);
      }
      navigate(returnTo);
    } catch (exception) {
      setError(mode === "register"
        ? "Registration could not be completed. Please review your details and try again."
        : "Sign in failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function demo(role: "CUSTOMER" | "PROVIDER") {
    setError("");
    setNotice("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await loginAs(role);
      navigate(role === "CUSTOMER" ? returnTo : "/provider");
    } catch {
      setError("Start the backend and database to use seeded demo users.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <motion.section className="auth-card" initial="hidden" animate="visible" variants={fadeUp}>
        <span className="eyebrow"><LockKeyhole size={17} />Protected CarHub access</span>
        <h1>{mode === "register" ? "Create your CarHub account" : mode === "forgot" ? "Recover access" : "Welcome back"}</h1>
        <p>Sign in to manage requests, support, and feedback securely.</p>
        {mode === "login" && (
          <div className="auth-switch-panel">
            <span>New to CarHub?</span>
            <Link to="/register">Create a customer account</Link>
          </div>
        )}
        {mode === "login" && (
          <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>
        )}
        {mode === "register" && (
          <div className="auth-switch-panel">
            <span>Already registered?</span>
            <Link to="/login">Sign in instead</Link>
          </div>
        )}
        <form className="stacked-form" onSubmit={submit}>
          {mode === "register" && (
            <FormField name="fullName" error={fieldErrors.fullName}>
              <input name="fullName" placeholder="Full name" autoComplete="name" aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby="fullName-error" />
            </FormField>
          )}
          {mode === "register" && (
            <FormField name="mobile" error={fieldErrors.mobile}>
              <input name="mobile" placeholder="Mobile number" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(fieldErrors.mobile)} aria-describedby="mobile-error" />
            </FormField>
          )}
          {mode !== "forgot" && (
            <FormField name="email" error={fieldErrors.email}>
              <input name="email" placeholder="Email" type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby="email-error" />
            </FormField>
          )}
          {mode === "register" && (
            <FormField name="city" error={fieldErrors.city}>
              <input name="city" placeholder="City" autoComplete="address-level2" aria-invalid={Boolean(fieldErrors.city)} aria-describedby="city-error" />
            </FormField>
          )}
          {mode === "register" && (
            <FormField name="state" error={fieldErrors.state}>
              <input name="state" placeholder="State" autoComplete="address-level1" aria-invalid={Boolean(fieldErrors.state)} aria-describedby="state-error" />
            </FormField>
          )}
          {mode === "register" && (
            <FormField name="country" error={fieldErrors.country}>
              <input name="country" placeholder="Country" autoComplete="country-name" aria-invalid={Boolean(fieldErrors.country)} aria-describedby="country-error" />
            </FormField>
          )}
          {mode !== "forgot" && (
            <FormField name="password" error={fieldErrors.password}>
              <input name="password" placeholder="Password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} aria-invalid={Boolean(fieldErrors.password)} aria-describedby="password-error password-help" />
              {mode === "register" && <span className="form-helper" id="password-help">Use 8+ characters with uppercase, lowercase, number, and symbol.</span>}
            </FormField>
          )}
          {mode === "forgot" && (
            <FormField name="identity" error={fieldErrors.identity}>
              <input name="identity" placeholder="Registered email or mobile number" autoComplete="email" aria-invalid={Boolean(fieldErrors.identity)} aria-describedby="identity-error" />
            </FormField>
          )}
          {mode === "register" && (
            <label className={`consent-line ${fieldErrors.consent ? "invalid" : ""}`}>
              <input name="consent" type="checkbox" aria-invalid={Boolean(fieldErrors.consent)} aria-describedby="consent-error" />
              I agree to CarHub terms, privacy policy, and controlled provider data sharing.
              {fieldErrors.consent && <span className="field-error" id="consent-error">{fieldErrors.consent}</span>}
            </label>
          )}
          {error && <div className="error-box"><span>{error}</span></div>}
          {notice && <div className="notice-panel">{notice}</div>}
          <button className="primary-button auth-submit-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "register" ? "Create account" : mode === "forgot" ? "Request recovery" : "Sign in securely"}
          </button>
        </form>
        <div className="role-switcher" aria-label="Seeded demo role shortcuts">
          <button onClick={() => demo("CUSTOMER")} disabled={submitting}>Customer demo</button>
          <button onClick={() => demo("PROVIDER")} disabled={submitting}>Provider demo</button>
        </div>
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

export function RequestWizardPage() {
  const { packageId } = useParams();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = requestSchema.safeParse(Object.fromEntries(form));
    if (!result.success) {
      setErrors(result.error.issues.map((issue) => issue.message));
      return;
    }
    setErrors([]);
    const [budgetMin, budgetMax] = String(result.data.budget).split("-").map((value) => Number(value.trim()) || undefined);
    try {
      await api.post<ApiRequest>("/customer/requests", {
        packageId,
        destination: result.data.destination,
        currentLocation: result.data.currentLocation,
        travelersCount: result.data.travelers,
        travelStartDate: result.data.startDate,
        travelEndDate: result.data.endDate,
        budgetMin,
        budgetMax,
        tripType: result.data.tripType,
        specialRequirements: String(form.get("specialRequirements") ?? ""),
        emergencyContactName: "Emergency Contact",
        emergencyContactMobile: result.data.emergencyContact
      });
      setSubmitted(true);
    } catch (exception) {
      setErrors([exception instanceof Error ? exception.message : "Request submission failed"]);
    }
  }

  if (submitted) {
    return (
      <div className="page padded-page">
        <section className="success-panel">
          <CheckCircle2 size={48} />
          <h1>Request submitted to CarHub admin</h1>
          <p>CarHub admin will review it before any provider receives scoped details.</p>
          <Link className="primary-button" to="/customer/requests">View My Requests</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page padded-page">
      <section className="wizard-shell">
        <div className="wizard-summary">
          <span className="eyebrow">Step {step} of 3</span>
          <h1>Request selected package</h1>
          <p>CarHub reviews every request before provider sharing.</p>
          <div className="progress-line"><span style={{ width: `${(step / 3) * 100}%` }} /></div>
        </div>
        <form className="wizard-form" onSubmit={submit}>
          <fieldset className={`step-pane ${step === 1 ? "active" : ""}`}>
            <input name="destination" placeholder="Destination" required />
            <input name="currentLocation" placeholder="Current location" required />
            <input name="travelers" placeholder="Number of travelers" type="number" required />
          </fieldset>
          <fieldset className={`step-pane ${step === 2 ? "active" : ""}`}>
            <input name="startDate" type="date" required />
            <input name="endDate" type="date" required />
            <input name="budget" placeholder="Budget range, example 20000-50000" required />
          </fieldset>
          <fieldset className={`step-pane ${step === 3 ? "active" : ""}`}>
            <input name="tripType" placeholder="Trip type" required />
            <input name="emergencyContact" placeholder="Emergency contact mobile" required />
            <textarea name="specialRequirements" placeholder="Special requirements" />
          </fieldset>
          {errors.length > 0 && <div className="error-box">{errors.map((error) => <span key={error}>{error}</span>)}</div>}
          <div className="wizard-actions">
            <button className="outline-button" type="button" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button>
            {step < 3 ? (
              <button className="primary-button" type="button" onClick={() => setStep(step + 1)}>Continue</button>
            ) : (
              <button className="primary-button" type="submit">Submit Request</button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export function CustomerDashboard() {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [message, setMessage] = useState("");

  async function loadCustomerWorkspace() {
    const [requestData, ticketData] = await Promise.all([
      api.get<ApiRequest[]>("/customer/requests").catch(() => []),
      api.get<SupportTicket[]>("/customer/support").catch(() => [])
    ]);
    setRequests(requestData);
    setTickets(ticketData);
  }

  useEffect(() => { void loadCustomerWorkspace(); }, []);

  async function createSupportTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const requestId = String(form.get("requestId") ?? "");
    try {
      await api.post<SupportTicket>("/customer/support", {
        requestId: requestId || null,
        category: form.get("category"),
        priority: form.get("priority"),
        subject: form.get("subject"),
        description: form.get("description")
      });
      event.currentTarget.reset();
      setMessage("Support ticket created. CarHub operations can now coordinate under company control.");
      await loadCustomerWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Support ticket could not be created.");
    }
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await api.post<FeedbackItem>("/customer/feedback", {
        requestId: form.get("requestId"),
        packageRating: Number(form.get("packageRating")),
        supportRating: Number(form.get("supportRating")),
        comment: form.get("comment")
      });
      event.currentTarget.reset();
      setMessage("Feedback submitted for moderation.");
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Feedback could not be submitted.");
    }
  }

  const completedRequests = requests.filter((request) => request.status === "COMPLETED");

  return (
    <DashboardShell title="Customer workspace" role="CUSTOMER">
      <Metric icon={<ClipboardCheck />} label="Requests" value={`${requests.length} total`} tone="blue" />
      <Metric icon={<Clock3 />} label="Under review" value={`${requests.filter((item) => item.status === "UNDER_REVIEW").length} request`} tone="amber" />
      <Metric icon={<Bell />} label="Support tickets" value={`${tickets.length} open`} tone="green" />
      <RequestRows requests={requests} />
      <div className="ops-panel">
        <h3>Support and helpline</h3>
        {message && <p className="trust-note">{message}</p>}
        <form className="compact-form" onSubmit={createSupportTicket}>
          <select name="requestId" aria-label="Related request">
            <option value="">General support request</option>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>{request.destination} - {request.status.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select name="category" defaultValue="TRAVEL_SUPPORT" aria-label="Support category">
            <option value="TRAVEL_SUPPORT">Travel support</option>
            <option value="PROVIDER_NO_SHOW">Provider no-show</option>
            <option value="MEDICAL_EMERGENCY">Medical emergency</option>
            <option value="RESCHEDULE">Reschedule</option>
          </select>
          <select name="priority" defaultValue="MEDIUM" aria-label="Priority">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
          <input name="subject" placeholder="Subject" required />
          <textarea name="description" placeholder="Describe what happened" required />
          <button className="primary-button" type="submit">Create support ticket</button>
        </form>
        <div className="mini-list">
          {tickets.length === 0 && <p className="muted">No support tickets yet.</p>}
          {tickets.map((ticket) => (
            <div className="status-line" key={ticket.id}>
              <strong>{ticket.subject}</strong>
              <span>{ticket.priority} - {ticket.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ops-panel">
        <h3>Post-trip feedback</h3>
        {completedRequests.length === 0 ? (
          <p className="muted">Feedback opens after the company marks a trip as completed.</p>
        ) : (
          <form className="compact-form" onSubmit={submitFeedback}>
            <select name="requestId" aria-label="Completed request">
              {completedRequests.map((request) => (
                <option key={request.id} value={request.id}>{request.destination}</option>
              ))}
            </select>
            <select name="packageRating" defaultValue="5" aria-label="Package rating">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} package rating</option>)}
            </select>
            <select name="supportRating" defaultValue="5" aria-label="Support rating">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} support rating</option>)}
            </select>
            <textarea name="comment" placeholder="Share your travel and support experience" />
            <button className="primary-button" type="submit">Submit feedback</button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}

export function ProviderDashboard() {
  const [assignments, setAssignments] = useState<ProviderAssignment[]>([]);
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submittingPackage, setSubmittingPackage] = useState(false);

  async function loadProviderWorkspace() {
    const [assignmentData, packageData] = await Promise.all([
      api.get<ProviderAssignment[]>("/provider/assignments").catch(() => []),
      api.get<ApiPackage[]>("/provider/packages").catch(() => [])
    ]);
    setAssignments(assignmentData);
    setPackages(packageData);
  }

  useEffect(() => { void loadProviderWorkspace(); }, []);

  async function updateStatus(id: string, status: RequestStatus) {
    setMessage("");
    try {
      await api.post<ProviderAssignment>(`/provider/assignments/${id}/status`, { status, reason: `Provider updated to ${status}` });
      await loadProviderWorkspace();
      setMessage(`Assignment updated to ${status.replace(/_/g, " ")}.`);
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Provider status update failed.");
    }
  }

  async function submitPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const result = providerPackageSchema.safeParse(Object.fromEntries(form));
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }
    setSubmittingPackage(true);
    try {
      await api.post<ApiPackage>("/provider/packages", {
        ...result.data,
        currency: result.data.currency.toUpperCase()
      });
      event.currentTarget.reset();
      setMessage("Package proposal submitted to CarHub admin. It is hidden from customers until approval.");
      await loadProviderWorkspace();
    } catch {
      setMessage("Package proposal could not be submitted. Please review details and try again.");
    } finally {
      setSubmittingPackage(false);
    }
  }

  return (
    <DashboardShell title="Provider assignments" role="PROVIDER">
      <Metric icon={<TicketCheck />} label="Approved assignments" value={`${assignments.length}`} tone="blue" />
      <Metric icon={<LockKeyhole />} label="Unapproved leads visible" value="0" tone="green" />
      <Metric icon={<Clock3 />} label="Package proposals" value={`${packages.length}`} tone="amber" />
      <div className="ops-panel">
        <h3>Submit package for company approval</h3>
        <p className="muted">Provider package data is sent to CarHub admin first. Customers see it only after company approval.</p>
        {message && <p className="trust-note">{message}</p>}
        <form className="compact-form package-proposal-form" onSubmit={submitPackage}>
          <FormField name="title" error={fieldErrors.title}>
            <input name="title" placeholder="Package title" aria-invalid={Boolean(fieldErrors.title)} aria-describedby="title-error" />
          </FormField>
          <FormField name="destination" error={fieldErrors.destination}>
            <input name="destination" placeholder="Destination" aria-invalid={Boolean(fieldErrors.destination)} aria-describedby="destination-error" />
          </FormField>
          <FormField name="category" error={fieldErrors.category}>
            <input name="category" placeholder="Category" aria-invalid={Boolean(fieldErrors.category)} aria-describedby="category-error" />
          </FormField>
          <FormField name="startingPrice" error={fieldErrors.startingPrice}>
            <input name="startingPrice" placeholder="Starting price" type="number" min="1" aria-invalid={Boolean(fieldErrors.startingPrice)} aria-describedby="startingPrice-error" />
          </FormField>
          <FormField name="currency" error={fieldErrors.currency}>
            <input name="currency" placeholder="Currency, example INR" defaultValue="INR" maxLength={3} aria-invalid={Boolean(fieldErrors.currency)} aria-describedby="currency-error" />
          </FormField>
          <FormField name="durationDays" error={fieldErrors.durationDays}>
            <input name="durationDays" placeholder="Duration days" type="number" min="1" max="60" aria-invalid={Boolean(fieldErrors.durationDays)} aria-describedby="durationDays-error" />
          </FormField>
          <FormField name="summary" error={fieldErrors.summary}>
            <input name="summary" placeholder="Short customer-facing summary" aria-invalid={Boolean(fieldErrors.summary)} aria-describedby="summary-error" />
          </FormField>
          <FormField name="imageUrl" error={fieldErrors.imageUrl}>
            <input name="imageUrl" placeholder="Image URL" aria-invalid={Boolean(fieldErrors.imageUrl)} aria-describedby="imageUrl-error" />
          </FormField>
          <FormField name="description" error={fieldErrors.description}>
            <textarea name="description" placeholder="Detailed itinerary, inclusions, execution capability, and service notes" aria-invalid={Boolean(fieldErrors.description)} aria-describedby="description-error" />
          </FormField>
          <button className="primary-button" type="submit" disabled={submittingPackage}>
            {submittingPackage ? "Submitting..." : "Submit to admin review"}
          </button>
        </form>
      </div>
      <div className="ops-panel">
        <h3>Package approval status</h3>
        {packages.length === 0 && <p className="muted">No package proposals submitted yet.</p>}
        <div className="proposal-grid">
          {packages.map((pack) => (
            <div className="status-line" key={pack.id}>
              <strong>{pack.title}</strong>
              <span>{pack.destination} - {(pack.availabilityStatus ?? "PENDING").replace(/_/g, " ")}</span>
              {pack.reviewNotes && <small>{pack.reviewNotes}</small>}
            </div>
          ))}
        </div>
      </div>
      <div className="ops-panel">
        <h3>Scoped customer payload</h3>
        {assignments.length === 0 && <p className="muted">No assigned approved work yet.</p>}
        {assignments.map((assignment) => (
          <div className="timeline-row" key={assignment.assignmentId}>
            <strong>{assignment.status.replace(/_/g, " ")}</strong>
            <span>{assignment.visibleFields}</span>
            <p className="muted">{assignment.maskedPayload}</p>
            <div className="row-actions">
              <button className="outline-button" onClick={() => updateStatus(assignment.assignmentId, "ACCEPTED_BY_PROVIDER")}>Accept</button>
              <button className="outline-button" onClick={() => updateStatus(assignment.assignmentId, "IN_PROGRESS")}>In progress</button>
              <button className="outline-button" onClick={() => updateStatus(assignment.assignmentId, "SUPPORT_ESCALATION")}>Escalate</button>
              <button className="primary-button" onClick={() => updateStatus(assignment.assignmentId, "COMPLETED")}>Mark completed</button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
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

function RequestRows({ requests }: { requests: ApiRequest[] }) {
  const statuses: RequestStatus[] = requests.length ? requests.map((request) => request.status) : ["REQUEST_SUBMITTED", "UNDER_REVIEW", "APPROVED_BY_COMPANY", "FORWARDED_TO_PROVIDER"];
  return (
    <div className="ops-panel wide">
      <h3>Request timeline</h3>
      {statuses.map((status, index) => (
        <div className="timeline-row" key={`${status}-${index}`}>
          <span>{index + 1}</span>
          <strong>{status.replace(/_/g, " ")}</strong>
        </div>
      ))}
    </div>
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
          <p>Loading company-controlled content...</p>
        ) : (
          <>
            <p className="lead-copy">{page?.summary ?? "This content is managed by CarHub admin."}</p>
            <p>{page?.body ?? "CarHub prioritizes privacy, transparent request handling, company-controlled provider sharing, and accountable support."}</p>
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
