import { Fragment, FormEvent, ReactNode, useEffect, useState } from "react";
import { Activity, ArrowRight, BriefcaseBusiness, ClipboardList, Clock3, Database, Eye, EyeOff, FileCheck2, FileText, Gauge, LifeBuoy, LockKeyhole, Menu, PackageCheck, ShieldCheck, UsersRound, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { api } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { ApiPackage, AuditLogItem, BookingTicket, ContentPage, CustomerOverview, FeedbackItem, ProviderProfile, SupportTicket } from "../types";

const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid admin email address."),
  password: z.string().min(1, "Password is required.")
});

const recoverySchema = z.object({
  identity: z.string().trim().min(1, "Enter registered email.")
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

type FieldErrors = Record<string, string>;

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

export function AuthPage({ mode }: { mode: "login" | "register" | "forgot" }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/admin";
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"request" | "otp" | "password">("request");
  const [identity, setIdentity] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (mode === "login") {
      setLoginEmail("");
      setLoginPassword("");
    }
  }, [mode, location.key]);

  function goBackFromForgot() {
    setError("");
    setNotice("");
    setFieldErrors({});
    navigate("/login");
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
          const result = recoverySchema.safeParse({ identity: String(form.get("identity") ?? "") });
          if (!result.success) {
            setFieldErrors(getFieldErrors(result.error));
            return;
          }
          setIdentity(result.data.identity);
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          await api.post("/auth/password/forgot", { identity: result.data.identity, email: result.data.identity, flow: "otp" });
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
          setError("Enter registered email.");
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
        navigate("/login");
        return;
      }

      const result = adminLoginSchema.safeParse({
        email: loginEmail,
        password: loginPassword
      });
      if (!result.success) {
        setFieldErrors(getFieldErrors(result.error));
        return;
      }
      await login(result.data.email, result.data.password);
      navigate(returnTo);
    } catch (exception) {
      setError(getUserFriendlyError(exception, mode === "forgot" ? "Password recovery failed." : "Sign in failed."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className={`auth-card ${mode === "login" ? "admin-login-card" : ""}`}>
        <img className="auth-card-logo" src="/carhub-logo.png" alt="CarHub" />
        <span className="eyebrow"><LockKeyhole size={17} />Admin control center</span>
        <h1>{mode === "forgot" ? "Recover admin access" : "Welcome back"}</h1>
        <p>
          {mode === "forgot"
            ? "Use your registered email."
            : "Sign in to manage bookings, package availability, support."}
        </p>
        <form className="stacked-form" onSubmit={submit}>
          {mode !== "forgot" && (
            <FormField name="email" error={fieldErrors.email}>
              <input
                name="email"
                placeholder="Admin email"
                type="email"
                autoComplete="off"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby="email-error"
              />
            </FormField>
          )}
          {mode !== "forgot" && (
            <FormField name="password" error={fieldErrors.password}>
              <div className="password-input-wrap">
                <input
                  name="password"
                  placeholder="Password"
                  type={showAuthPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby="password-error"
                />
                <button type="button" className="password-visibility-button" onClick={() => setShowAuthPassword((value) => !value)} aria-label={showAuthPassword ? "Hide password" : "Show password"}>
                  {showAuthPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </FormField>
          )}
          {mode === "login" && (
            <div className="auth-bottom-links">
              <button type="button" className="text-link forgot-password-link" onClick={() => navigate("/forgot-password")}>Forgot password?</button>
              <button type="button" className="text-link forgot-password-link" onClick={() => navigate("/change-email")}>Change email?</button>
            </div>
          )}
          {mode === "forgot" && (
            <>
              <div className="auth-actions-bar">
                <button type="button" className="text-link" onClick={goBackFromForgot}>Go back</button>
              </div>
              {recoveryStep === "request" && (
                <FormField name="identity" error={fieldErrors.identity}>
                <input
                  name="identity"
                  placeholder="Registered email address"
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
              : "Sign in securely"}
          </button>
        </form>
      </section>
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

function dash(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "Not added" : String(value);
}

function formatDate(value?: string) {
  if (!value) return "Not added";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusText(value?: string) {
  const text = dash(value).replace(/_/g, " ").toLowerCase();
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}

function suggestedDistanceFromPune(destination: string) {
  const value = destination.toLowerCase();
  if (/lonavala|khandala|karla/.test(value)) return 65;
  if (/mahabaleshwar/.test(value)) return 121;
  if (/panchgani/.test(value)) return 100;
  if (/alibaug|alibag|mandwa/.test(value)) return 140;
  if (/shirdi/.test(value)) return 185;
  if (/nashik/.test(value)) return 210;
  if (/kolad/.test(value)) return 120;
  if (/mumbai/.test(value)) return 162;
  if (/sinhagad/.test(value)) return 35;
  return null;
}

type AdminSection = "overview" | "customers" | "providers" | "bookings" | "packages" | "review" | "support" | "content" | "audit";

const adminSectionIds: AdminSection[] = ["overview", "customers", "providers", "bookings", "packages", "review", "support", "content", "audit"];

function getAdminSection(pathname: string): AdminSection {
  const section = pathname.replace(/^\/admin\/?/, "").split("/")[0] as AdminSection;
  return adminSectionIds.includes(section) ? section : "overview";
}

export function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [audit, setAudit] = useState<AuditLogItem[]>([]);
  const [pendingPackages, setPendingPackages] = useState<ApiPackage[]>([]);
  const [allPackages, setAllPackages] = useState<ApiPackage[]>([]);
  const [bookingTickets, setBookingTickets] = useState<BookingTicket[]>([]);
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [customers, setCustomers] = useState<CustomerOverview[]>([]);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedPackageIds, setSavedPackageIds] = useState<Set<string>>(new Set());
  const [editingPackageIds, setEditingPackageIds] = useState<Set<string>>(new Set());
  const [selectedPackageIdx, setSelectedPackageIdx] = useState(0);
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});
  const [filePreview, setFilePreview] = useState<Record<string, { image?: string; video?: string }>>({});

  async function loadAdminWorkspace() {
    const [ticketData, feedbackData, auditData, pendingPackageData, allPackageData, bookingTicketData, contentPageData, providerData, customerData] = await Promise.all([
      api.get<SupportTicket[]>("/support/tickets").catch(() => []),
      api.get<FeedbackItem[]>("/admin/feedback").catch(() => []),
      api.get<AuditLogItem[]>("/admin/audit").catch(() => []),
      api.get<ApiPackage[]>("/admin/packages/pending").catch(() => []),
      api.get<ApiPackage[]>("/admin/packages").catch(() => []),
      api.get<BookingTicket[]>("/admin/tickets").catch(() => []),
      api.get<ContentPage[]>("/admin/content").catch(() => []),
      api.get<ProviderProfile[]>("/admin/providers").catch(() => []),
      api.get<CustomerOverview[]>("/admin/customers").catch(() => [])
    ]);
    setTickets(ticketData);
    setFeedback(feedbackData);
    setAudit(auditData);
    setPendingPackages(pendingPackageData);
    setAllPackages(allPackageData);
    setBookingTickets(bookingTicketData);
    setContentPages(contentPageData);
    setProviders(providerData);
    setCustomers(customerData);
  }

  useEffect(() => { void loadAdminWorkspace(); }, []);

  async function reviewPackage(packageId: string, decision: "APPROVED" | "REJECTED" | "NEEDS_CHANGES") {
    try {
      await api.post<ApiPackage>(`/admin/packages/${packageId}/review`, {
        decision,
        reviewNotes: decision === "APPROVED"
          ? "Approved for the public catalog."
          : decision === "NEEDS_CHANGES"
            ? "Provider must improve package details before approval."
            : "Rejected during package review.",
        featured: decision === "APPROVED"
      });
      setMessage(`Package proposal ${decision.replace(/_/g, " ").toLowerCase()}.`);
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Package review action failed.");
    }
  }

  async function saveContent(event: FormEvent<HTMLFormElement>, slug: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.put<ContentPage>(`/admin/content/${slug}`, {
        title: form.get("title"),
        summary: form.get("summary"),
        body: form.get("body"),
        contactEmail: form.get("contactEmail"),
        contactPhone: form.get("contactPhone"),
        supportHours: form.get("supportHours"),
        published: form.get("published") === "on"
      });
      setMessage(`${slug.replace(/-/g, " ")} content updated.`);
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Content update failed.");
    }
  }

  async function handlePackageSave(event: FormEvent<HTMLFormElement>, packageId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const imageFile = form.get("imageUrl");
    const videoFile = form.get("videoFile");
    const existingImageUrl = String(form.get("existingImageUrl") ?? "");
    const existingVideoUrl = String(form.get("existingVideoUrl") ?? "");
    const imageUrlText = String(form.get("imageUrlText") ?? "").trim();
    const videoUrlText = String(form.get("videoUrlText") ?? "").trim();
    let imageUrl: string | undefined;
    let videoUrl: string | undefined;
    // image: file upload > pasted URL > existing
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await fileToDataUrl(imageFile);
    } else if (imageUrlText) {
      imageUrl = imageUrlText;
    } else {
      imageUrl = existingImageUrl || undefined;
    }
    // video: file upload > pasted URL > existing
    if (videoFile instanceof File && videoFile.size > 0) {
      videoUrl = await fileToDataUrl(videoFile);
    } else if (videoUrlText) {
      videoUrl = videoUrlText;
    } else {
      videoUrl = existingVideoUrl || undefined;
    }
    try {
      await api.put<ApiPackage>(`/admin/packages/${packageId}`, {
        title: form.get("title"),
        destination: form.get("destination"),
        category: form.get("category"),
        summary: form.get("summary"),
        description: form.get("description"),
        startingPrice: nullableNumber(form.get("startingPrice")),
        durationDays: nullableNumber(form.get("durationDays")),
        imageUrl: imageUrl,
        localPlaces: form.get("localPlaces"),
        availabilityStatus: form.get("availabilityStatus"),
        reviewNotes: form.get("reviewNotes"),
        featured: form.get("featured") === "on",
        videoUrl: videoUrl,
        carPhotoUrl: form.get("carPhotoUrl"),
        carNumber: form.get("carNumber"),
        carModel: form.get("carModel"),
        seatsAvailable: nullableNumber(form.get("seatsAvailable")),
        distanceKm: nullableNumber(form.get("distanceKm")),
        pricePerKm: nullableNumber(form.get("pricePerKm")),
        providerNotes: form.get("providerNotes"),
        region: form.get("region") || undefined,
        routeOrder: form.get("routeOrder") || undefined,
        totalDistanceKm: nullableNumber(form.get("totalDistanceKm")),
        subPlaces: form.get("subPlaces") || undefined
      });
      setSavedPackageIds((prev) => new Set(prev).add(packageId));
      setEditingPackageIds((prev) => { const next = new Set(prev); next.delete(packageId); return next; });
      setPendingStatus((prev) => { const next = { ...prev }; delete next[packageId]; return next; });
      setFilePreview((prev) => { const next = { ...prev }; delete next[packageId]; return next; });
      setMessage("Package updated successfully.");
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Package update failed.");
    }
  }

  const livePackages = allPackages.filter((item) => item.availabilityStatus === "AVAILABLE");
  const providerReviewCount = providers.filter((provider) => provider.verificationStatus !== "APPROVED" || provider.suspended).length;
  const openTicketCount = tickets.filter((ticket) => ticket.status !== "CLOSED").length;
  const activeSection = getAdminSection(location.pathname);
  const activeProviderCount = providers.filter((provider) => provider.verificationStatus === "APPROVED" && !provider.suspended).length;
  const activeCustomerCount = customers.filter((customer) => customer.status === "ACTIVE").length;

  async function handleProviderSave(event: FormEvent<HTMLFormElement>, providerId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const combinedStatus = String(form.get("combinedStatus") ?? "PENDING");
    const isSuspended = combinedStatus === "SUSPENDED";
    const verificationStatus = isSuspended
      ? (providers.find((p) => p.id === providerId)?.verificationStatus ?? "PENDING")
      : combinedStatus;
    try {
      await api.put<ProviderProfile>(`/admin/providers/${providerId}`, {
        verificationStatus,
        suspended: isSuspended,
        qualityScore: nullableNumber(form.get("qualityScore"))
      });
      setMessage("Provider updated.");
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Provider update failed.");
    }
  }

  async function handleCustomerSave(event: FormEvent<HTMLFormElement>, customerId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.put<CustomerOverview>(`/admin/customers/${customerId}`, {
        status: form.get("status")
      });
      setMessage("Customer account status updated.");
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Customer update failed.");
    }
  }

  async function moderateFeedback(feedbackId: string, moderationStatus: "APPROVED" | "REJECTED" | "PENDING") {
    try {
      await api.put<FeedbackItem>(`/admin/feedback/${feedbackId}`, { moderationStatus });
      setMessage(`Feedback ${moderationStatus.toLowerCase()}.`);
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Feedback moderation failed.");
    }
  }

  const sections: Array<{ id: AdminSection; label: string; description: string; count: number; icon: ReactNode }> = [
    { id: "overview", label: "Overview", description: "Health and quick activity", count: pendingPackages.length + providerReviewCount, icon: <Gauge size={18} /> },
    { id: "customers", label: "Customers", description: "Profiles and booking activity", count: customers.length, icon: <UsersRound size={18} /> },
    { id: "providers", label: "Providers", description: "Verification and operations", count: providers.length, icon: <BriefcaseBusiness size={18} /> },
    { id: "bookings", label: "Bookings", description: "Customer tickets and trips", count: bookingTickets.length, icon: <ClipboardList size={18} /> },
    { id: "packages", label: "Packages", description: "Inventory and pricing", count: allPackages.length, icon: <PackageCheck size={18} /> },
    { id: "review", label: "Review queue", description: "Items needing approval", count: pendingPackages.length, icon: <FileCheck2 size={18} /> },
    { id: "support", label: "Support", description: "Tickets and feedback", count: openTicketCount, icon: <LifeBuoy size={18} /> },
    { id: "content", label: "Content", description: "Website page copy", count: contentPages.length, icon: <FileText size={18} /> },
    { id: "audit", label: "Audit", description: "System activity trail", count: audit.length, icon: <Activity size={18} /> }
  ];

  const currentSection = sections.find((section) => section.id === activeSection) ?? sections[0];

  function openSection(section: AdminSection) {
    navigate(section === "overview" ? "/admin" : `/admin/${section}`);
    setSidebarOpen(false);
  }

  function renderOverview() {
    return (
      <>
        <div className="metric-grid admin-overview-grid">
          <Metric icon={<ShieldCheck />} label="Direct bookings" value={`${bookingTickets.length}`} tone="blue" onClick={() => openSection("bookings")} />
          <Metric icon={<EyeOff />} label="Live packages" value={`${livePackages.length}`} tone="green" onClick={() => openSection("packages")} />
          <Metric icon={<FileCheck2 />} label="Needs review" value={`${pendingPackages.length + providerReviewCount}`} tone="amber" onClick={() => openSection("review")} />
          <Metric icon={<UsersRound />} label="Providers" value={`${providers.length}`} tone="green" onClick={() => openSection("providers")} />
          <Metric icon={<Database />} label="Customers" value={`${customers.length}`} tone="blue" onClick={() => openSection("customers")} />
          <Metric icon={<LifeBuoy />} label="Open support" value={`${openTicketCount}`} tone="red" onClick={() => openSection("support")} />
        </div>
      </>
    );
  }

  function renderCustomers() {
    return (
      <div className="ops-panel">
        <div className="panel-title-row">
          <div>
            <h3>Customer activity</h3>
            <p className="muted">{customers.length} customers registered. {activeCustomerCount} active accounts.</p>
          </div>
        </div>
        {customers.length === 0 ? <p className="muted">No customer profiles found.</p> : (
          <div className="admin-table admin-customer-table">
            <div className="admin-table-head">
              <span>Customer</span><span>Contact</span><span>Address</span><span>Travel</span><span>Safety</span><span>Manage</span>
            </div>
            {customers.map((customer) => (
              <form className="admin-table-row" key={`${customer.id}-${customer.updatedAt}-${customer.status}`} onSubmit={(event) => handleCustomerSave(event, customer.id)}>
                <div><strong>{customer.fullName}</strong><small>Joined {formatDate(customer.createdAt)}</small></div>
                <div><span>{customer.mobile}</span><small>{customer.email}</small></div>
                <div><span>{dash(customer.city ?? customer.address)}</span><small>{dash(customer.pinCode ?? customer.state)}</small></div>
                <div><span>{customer.bookingCount} bookings</span><small>{dash(customer.preferredTravelType)}</small></div>
                <div><span>{dash(customer.emergencyContactMobile)}</span><small>{dash(customer.emergencyContactName)}</small></div>
                <div className="admin-row-controls compact">
                  <select name="status" defaultValue={customer.status} aria-label={`${customer.fullName} status`}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                  <span className="status-chip">{customer.profileCompleted ? "Profile complete" : "Profile incomplete"}</span>
                  <button className="primary-button" type="submit">Update</button>
                </div>
              </form>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderProviders() {
    return (
      <div className="ops-panel">
        <div className="panel-title-row">
          <div>
            <h3>Provider verification</h3>
            <p className="muted">{providers.length} providers registered. {activeProviderCount} approved and active.</p>
          </div>
        </div>
        {providers.length === 0 ? <p className="muted">No provider profiles found.</p> : (
          <div className="admin-table admin-provider-table">
            <div className="admin-table-head">
              <span>Provider</span><span>Contact</span><span>Documents</span><span>Operations</span><span>Risk</span><span>Manage</span>
            </div>
            {providers.map((provider) => {
              const isApproved = provider.verificationStatus === "APPROVED" && !provider.suspended;
              const combinedDefault = provider.suspended ? "SUSPENDED" : provider.verificationStatus;
              return (
                <form
                  className="admin-table-row"
                  key={`${provider.id}-${provider.updatedAt}-${provider.verificationStatus}-${provider.suspended}`}
                  onSubmit={(event) => handleProviderSave(event, provider.id)}
                >
                  <div><strong>{provider.businessName}</strong><small>{provider.contactPerson}</small></div>
                  <div><span>{provider.mobile ?? "No mobile"}</span><small>{provider.email ?? "No email"}</small></div>
                  <div>
                    <span>{provider.rcNumber ? `RC ${provider.rcNumber}` : "RC pending"}</span>
                    <small>{provider.rcDocumentUploaded ? "RC uploaded" : "RC missing"}</small>
                  </div>
                  <div>
                    <span>{provider.packageCount ?? 0} packages</span>
                    <small>{provider.bookingCount ?? 0} bookings</small>
                  </div>
                  <div>
                    <span className={`status-chip provider-status-chip--${combinedDefault.toLowerCase()}`}>
                      {provider.suspended ? "Suspended" : statusText(provider.verificationStatus)}
                    </span>
                    <small>{provider.complaintCount ?? 0} complaints · score {provider.qualityScore ?? 0}</small>
                  </div>

                  {/* ── Manage column ── */}
                  <div className="admin-row-controls compact provider-manage-col">
                    {isApproved ? (
                      /* One-time approval: once approved, verification is locked. Only show status + score. */
                      <>
                        <span className="provider-verified-badge">✓ Verified</span>
                        <input
                          name="qualityScore"
                          type="number" min="0" max="5" step="0.1"
                          defaultValue={provider.qualityScore ?? ""}
                          placeholder="Score 0–5"
                          aria-label={`${provider.businessName} quality score`}
                        />
                        <select
                          name="combinedStatus"
                          defaultValue={combinedDefault}
                          aria-label={`${provider.businessName} status`}
                        >
                          <option value="APPROVED">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                        <button className="primary-button provider-save-btn" type="submit">Save</button>
                      </>
                    ) : (
                      /* Not yet approved: show full verification dropdown + score */
                      <>
                        <select
                          name="combinedStatus"
                          defaultValue={combinedDefault}
                          aria-label={`${provider.businessName} status`}
                        >
                          <option value="APPROVED">Approved</option>
                          <option value="PENDING">Pending</option>
                          <option value="NEEDS_REVIEW">Needs review</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                        <input
                          name="qualityScore"
                          type="number" min="0" max="5" step="0.1"
                          defaultValue={provider.qualityScore ?? ""}
                          placeholder="Score 0–5"
                          aria-label={`${provider.businessName} quality score`}
                        />
                        <button className="primary-button provider-save-btn" type="submit">Save</button>
                      </>
                    )}
                  </div>
                </form>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderBookings() {
    return (
      <div className="ops-panel">
        <div className="panel-title-row">
          <div>
            <h3>Direct booking records</h3>
            <p className="muted">{bookingTickets.length} customer tickets with provider, vehicle, pickup, and payment references.</p>
          </div>
        </div>
        {bookingTickets.length === 0 ? <p className="muted">No direct bookings yet.</p> : (
          <div className="admin-table admin-booking-table">
            <div className="admin-table-head">
              <span>Ticket</span><span>Customer</span><span>Provider</span><span>Pickup</span><span>Vehicle</span><span>Status</span>
            </div>
            {bookingTickets.map((ticket) => (
              <div className="admin-table-row" key={ticket.id}>
                <div><strong>{ticket.ticketNumber}</strong><small>{ticket.packageName}</small></div>
                <div><span>{ticket.customerName ?? "Customer"}</span><small>{ticket.customerMobile ?? ticket.customerEmail ?? "Contact hidden"}</small></div>
                <div><span>{ticket.providerBusinessName}</span><small>{ticket.providerContactNumber}</small></div>
                <div><span>{ticket.pickupLocation ?? "Pickup pending"}</span><small>{ticket.pickupDate} {ticket.pickupTime}</small></div>
                <div><span>{ticket.carNumber ?? "Car pending"}</span><small>{ticket.carModel ?? ticket.carType.replace("_", " ")}</small></div>
                <div>
                  <span className="status-chip">{statusText(ticket.status)}</span>
                  <small>{ticket.providerLatitude && ticket.providerLongitude ? `${ticket.providerLatitude}, ${ticket.providerLongitude}` : "GPS pending"}</small>
                  {ticket.providerLatitude && ticket.providerLongitude && <a className="text-link" href={`https://www.google.com/maps?q=${ticket.providerLatitude},${ticket.providerLongitude}`} target="_blank" rel="noreferrer">Open map</a>}
                  {ticket.completedAt && <small>Completed {new Date(ticket.completedAt).toLocaleString()}</small>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderPackages() {
    const statusMeta: Record<string, { label: string; cls: string }> = {
      AVAILABLE: { label: "Available", cls: "available" },
      PENDING_ADMIN_REVIEW: { label: "Pending review", cls: "pending" },
      CHANGES_REQUESTED: { label: "Changes requested", cls: "changes" },
      REJECTED_BY_COMPANY: { label: "Rejected", cls: "rejected" },
      UNAVAILABLE: { label: "Unavailable", cls: "neutral" },
      BOOKED: { label: "Booked", cls: "booked" }
    };

    if (allPackages.length === 0) {
      return (
        <div className="ops-panel">
          <div className="panel-title-row"><div><h3>Provider package inventory</h3></div></div>
          <p className="muted">No packages found.</p>
        </div>
      );
    }

    const clampedIdx = Math.min(selectedPackageIdx, allPackages.length - 1);
    const pack = allPackages[clampedIdx];
    const meta = statusMeta[pack.availabilityStatus ?? ""] ?? { label: statusText(pack.availabilityStatus), cls: "neutral" };
    const suggestedDistance = suggestedDistanceFromPune(pack.destination);
    const isSaved = savedPackageIds.has(pack.id) && !editingPackageIds.has(pack.id);
    const selectedStatus = pendingStatus[pack.id] ?? pack.availabilityStatus ?? "AVAILABLE";
    const saveLabel = selectedStatus === "AVAILABLE" ? "Go Live"
      : selectedStatus === "UNAVAILABLE" ? "Make Unavailable"
      : "Save Changes";
    const preview = filePreview[pack.id];
    const previewImage = preview?.image ?? pack.imageUrl;
    const previewVideo = preview?.video ?? pack.videoUrl;

    return (
      <div className="ops-panel">
        <div className="panel-title-row">
          <div>
            <h3>Provider package inventory</h3>
            <p className="muted">{allPackages.length} package{allPackages.length === 1 ? "" : "s"} — admin controls status, pricing, featured flag, media and notes.</p>
          </div>
        </div>

        <div className="pkg-workspace">
          {/* ── Sidebar package list ── */}
          <aside className="pkg-sidebar">
            <p className="pkg-sidebar-label">All packages</p>
            {allPackages.map((p, idx) => {
              const m = statusMeta[p.availabilityStatus ?? ""] ?? { label: statusText(p.availabilityStatus), cls: "neutral" };
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`pkg-sidebar-item${idx === clampedIdx ? " pkg-sidebar-item--active" : ""}`}
                  onClick={() => setSelectedPackageIdx(idx)}
                >
                  <span className="pkg-sidebar-num">{idx + 1}</span>
                  <span className="pkg-sidebar-info">
                    <span className="pkg-sidebar-title">{p.title}</span>
                    <span className="pkg-sidebar-dest">{p.destination}</span>
                  </span>
                  <span className={`pkg-sidebar-dot pkg-sidebar-dot--${m.cls}`} />
                </button>
              );
            })}
          </aside>

          {/* ── Single package detail ── */}
          <div className="pkg-detail-area">
            {/* Prev / Next navigation */}
            <div className="pkg-nav-bar">
              <span className="pkg-nav-counter">{clampedIdx + 1} / {allPackages.length}</span>
              <div className="pkg-nav-actions">
                <button type="button" className="outline-button pkg-nav-btn" disabled={clampedIdx === 0} onClick={() => setSelectedPackageIdx(clampedIdx - 1)}>← Prev</button>
                <button type="button" className="outline-button pkg-nav-btn" disabled={clampedIdx === allPackages.length - 1} onClick={() => setSelectedPackageIdx(clampedIdx + 1)}>Next →</button>
              </div>
            </div>

            {/* Package form — identical internals, just one at a time */}
            {(() => (
                <form key={pack.id} className={`pkg-card pkg-card--${meta.cls}${isSaved ? " pkg-card--saved" : ""}`} onSubmit={(event) => handlePackageSave(event, pack.id)}>

                  {/* ── Top header row ── */}
                  {isSaved && (
                    <div className="pkg-saved-banner">
                      <span className="pkg-saved-icon">✓</span>
                      <span>Package updated successfully</span>
                      <button type="button" className="outline-button pkg-edit-unlock-btn" onClick={() => setEditingPackageIds((prev) => new Set(prev).add(pack.id))}>Edit</button>
                    </div>
                  )}

                  <fieldset disabled={isSaved} style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>

                  <div className="pkg-card-header">
                    <div className="pkg-card-title-group">
                      <strong className="pkg-card-title">{pack.title}</strong>
                      <span className="pkg-card-destination">{pack.destination}</span>
                    </div>
                    <div className="pkg-card-badges">
                      {pack.featured && <span className="pkg-featured-badge">★ Featured</span>}
                      <span className={`pkg-status-badge pkg-status-badge--${meta.cls}`}>{meta.label}</span>
                    </div>
                  </div>

                  {/* ── 3-column info body ── */}
                  {pack.reviewNotes && (
                    <div className={`pkg-update-note${pack.reviewNotes.startsWith("CANCEL REQUEST") ? " pkg-update-note--cancel" : ""}`}>
                      <strong>{pack.reviewNotes.startsWith("CANCEL REQUEST") ? "Cancellation request" : "Update message"}</strong>
                      <span>{pack.reviewNotes}</span>
                    </div>
                  )}

                  <div className="pkg-admin-controls">
                    <label className="pkg-field-label">
                      Package title
                      <input name="title" defaultValue={pack.title} aria-label={`${pack.title} title`} />
                    </label>
                    <label className="pkg-field-label">
                      Destination
                      <input name="destination" defaultValue={pack.destination} aria-label={`${pack.title} destination`} />
                    </label>
                    <label className="pkg-field-label">
                      Category
                      <input name="category" defaultValue={pack.category} aria-label={`${pack.title} category`} />
                    </label>
                    <label className="pkg-field-label">
                      Distance from Pune
                      <input name="distanceKm" type="number" min="0" step="0.1" defaultValue={pack.distanceKm ?? suggestedDistance ?? ""} placeholder={suggestedDistance ? `${suggestedDistance} km suggested` : "Enter km"} aria-label={`${pack.title} distance from Pune`} />
                    </label>
                    <label className="pkg-field-label">
                      Duration days
                      <input name="durationDays" type="number" min="1" max="30" defaultValue={pack.durationDays} aria-label={`${pack.title} duration days`} />
                    </label>
                    <label className="pkg-field-label">
                      Starting price
                      <input name="startingPrice" type="number" min="0" step="0.01" defaultValue={pack.startingPrice ?? ""} aria-label={`${pack.title} starting price`} />
                    </label>
                   <div className="pkg-field-label pkg-field-label--wide pkg-media-section">
                      <span className="pkg-media-label">Package media <span className="pkg-media-hint">(shown to customers on explore page)</span></span>

                      {/* Live preview — updates instantly when file is selected */}
                      {(previewVideo || previewImage) && (
                        <div className={`pkg-media-preview${preview ? " pkg-media-preview--changed" : ""}`}>
                          {previewVideo ? (
                            <video src={previewVideo} muted autoPlay loop playsInline className="pkg-media-preview-asset" />
                          ) : (
                            <img src={previewImage} alt="Package media preview" className="pkg-media-preview-asset" />
                          )}
                          <span className="pkg-media-preview-label">
                            {preview ? "⚡ New selection — save to apply" : "Current — what customers see"}
                          </span>
                        </div>
                      )}

                      <div className="pkg-media-upload-grid">
                        {/* Image upload */}
                        <div className="pkg-media-upload-card">
                          <span className="pkg-media-upload-title">🖼 Package image</span>
                          <label className="pkg-media-row-label">
                            Upload image file
                            <input
                              name="imageUrl"
                              type="file"
                              accept="image/*"
                              aria-label={`${pack.title} image file`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const dataUrl = await fileToDataUrl(file);
                                setFilePreview((prev) => ({ ...prev, [pack.id]: { ...prev[pack.id], image: dataUrl, video: undefined } }));
                              }}
                            />
                          </label>
                          <label className="pkg-media-row-label">
                            Or paste image URL
                            <input
                              name="imageUrlText"
                              type="url"
                              placeholder="https://images.unsplash.com/..."
                              defaultValue=""
                              aria-label={`${pack.title} image URL`}
                              onChange={(e) => {
                                const url = e.target.value.trim();
                                if (url) setFilePreview((prev) => ({ ...prev, [pack.id]: { ...prev[pack.id], image: url, video: undefined } }));
                              }}
                            />
                          </label>
                          <input name="existingImageUrl" type="hidden" value={
                            pack.imageUrl && !pack.imageUrl.startsWith("data:video/") ? pack.imageUrl : ""
                          } />
                        </div>

                        {/* Video upload */}
                        <div className="pkg-media-upload-card">
                          <span className="pkg-media-upload-title">🎬 Package video</span>
                          <label className="pkg-media-row-label">
                            Upload video file
                            <input
                              name="videoFile"
                              type="file"
                              accept="video/mp4,video/webm"
                              aria-label={`${pack.title} video file`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const dataUrl = await fileToDataUrl(file);
                                setFilePreview((prev) => ({ ...prev, [pack.id]: { ...prev[pack.id], video: dataUrl, image: undefined } }));
                              }}
                            />
                          </label>
                          <label className="pkg-media-row-label">
                            Or paste video URL
                            <input
                              name="videoUrlText"
                              type="url"
                              placeholder="https://example.com/video.mp4"
                              defaultValue={pack.videoUrl && !pack.videoUrl.startsWith("data:") ? pack.videoUrl : ""}
                              aria-label={`${pack.title} video URL`}
                              onChange={(e) => {
                                const url = e.target.value.trim();
                                if (url) setFilePreview((prev) => ({ ...prev, [pack.id]: { ...prev[pack.id], video: url, image: undefined } }));
                              }}
                            />
                          </label>
                          <input name="existingVideoUrl" type="hidden" value={pack.videoUrl ?? ""} />
                        </div>
                      </div>
                    </div>

                    <label className="pkg-field-label pkg-field-label--wide">
                      Local places
                      <textarea name="localPlaces" defaultValue={pack.localPlaces ?? ""} placeholder="Places covered in this package" aria-label={`${pack.title} local places`} />
                    </label>
                    <label className="pkg-field-label">
                      Region
                      <select name="region" defaultValue={pack.region ?? ""} aria-label={`${pack.title} region`}>
                        <option value="">— No region —</option>
                        <option value="Pune">Pune</option>
                        <option value="Nashik">Nashik</option>
                        <option value="Shirdi">Shirdi</option>
                        <option value="Multi-Region">Multi-Region</option>
                      </select>
                    </label>
                    <label className="pkg-field-label">
                      Total distance (km)
                      <input name="totalDistanceKm" type="number" min="0" step="1" defaultValue={pack.totalDistanceKm ?? ""} placeholder="e.g. 250" aria-label={`${pack.title} total distance km`} />
                    </label>
                    <label className="pkg-field-label pkg-field-label--wide">
                      Sub-places (comma-separated)
                      <input name="subPlaces" defaultValue={pack.subPlaces ?? ""} placeholder="e.g. Parvati Hill, Shaniwar Wada, Sinhagad Fort" aria-label={`${pack.title} sub places`} />
                    </label>
                    <label className="pkg-field-label pkg-field-label--wide">
                      Route order / itinerary
                      <textarea name="routeOrder" defaultValue={pack.routeOrder ?? ""} placeholder="e.g. Pune → Stop 1 (7AM) → Stop 2 (9AM) → Pune (6PM)" aria-label={`${pack.title} route order`} />
                    </label>
                    <label className="pkg-field-label pkg-field-label--wide">
                      Summary
                      <textarea name="summary" defaultValue={pack.summary} aria-label={`${pack.title} summary`} />
                    </label>
                    <label className="pkg-field-label pkg-field-label--wide">
                      Description
                      <textarea name="description" defaultValue={pack.description} aria-label={`${pack.title} description`} />
                    </label>
                    {suggestedDistance && !pack.distanceKm && <small className="pkg-distance-suggestion">Suggested route distance from Pune: {suggestedDistance} km</small>}
                  </div>

                  <div className="pkg-card-body">

                    {/* Provider column */}
                    <div className="pkg-card-col">
                      <span className="pkg-col-label">Provider</span>
                      <strong className="pkg-col-value">{pack.providerBusinessName ?? "—"}</strong>
                      <small className="pkg-col-detail">
                        {pack.pickupAvailabilityMode === "SPECIFIC"
                          ? `${pack.pickupStartTime ?? "--:--"} – ${pack.pickupEndTime ?? "--:--"}`
                          : "Pickup 24 / 7"}
                      </small>
                      <div className="pkg-doc-row">
                        <span className={pack.licenseDocumentUrl ? "pkg-doc-ok" : "pkg-doc-missing"}>
                          {pack.licenseDocumentUrl ? "✓ Licence" : "✗ Licence"}
                        </span>
                        <span className={pack.carPhotoUrl ? "pkg-doc-ok" : "pkg-doc-missing"}>
                          {pack.carPhotoUrl ? "✓ Car photo" : "✗ Car photo"}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle column */}
                    <div className="pkg-card-col">
                      <span className="pkg-col-label">Vehicle</span>
                      <strong className="pkg-col-value">{pack.carNumber ?? "Number pending"}</strong>
                      <small className="pkg-col-detail">{pack.carModel ?? statusText(pack.carType)} · {pack.seatsAvailable ?? 4} seats</small>
                      <small className="pkg-col-detail">RC: {pack.rcNumber || "Not provided"}</small>
                      <small className="pkg-col-detail">Licence: {pack.licenseNumber || "Not provided"}</small>
                      <small className="pkg-col-detail">Holder: {pack.licenseHolderName || "Not provided"}</small>
                    </div>

                    {/* Pricing column — simple */}
                    <div className="pkg-card-col pkg-pricing-col">
                      <span className="pkg-col-label">Pricing</span>
                      <div className={`pkg-payout-badge ${pack.providerPayout ? "pkg-payout-badge--set" : "pkg-payout-badge--pending"}`}>
                        {pack.providerPayout ? `INR ${Number(pack.providerPayout).toLocaleString("en-IN")}` : "Payout pending"}
                      </div>
                      <label className="pkg-field-label">
                        Charge per km
                        <div className="pkg-km-wrap">
                          <span className="pkg-km-prefix">INR</span>
                          <input
                            name="pricePerKm"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={pack.pricePerKm ?? ""}
                            placeholder="0.00"
                            aria-label={`${pack.title} price per km`}
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="pkg-verification-panel">
                    <div>
                      <span className="pkg-col-label">Submitted verification</span>
                      <strong>Provider uploads and vehicle documents</strong>
                    </div>
                    <div className="pkg-doc-row">
                      {pack.carPhotoUrl ? <a className="pkg-doc-ok" href={pack.carPhotoUrl} target="_blank" rel="noreferrer">View car photo</a> : <span className="pkg-doc-missing">Car photo missing</span>}
                      {pack.licenseDocumentUrl ? <a className="pkg-doc-ok" href={pack.licenseDocumentUrl} target="_blank" rel="noreferrer">View licence</a> : <span className="pkg-doc-missing">Licence missing</span>}
                      {pack.rcDocumentUrl ? <a className="pkg-doc-ok" href={pack.rcDocumentUrl} target="_blank" rel="noreferrer">View RC document</a> : <span className="pkg-doc-missing">RC document missing</span>}
                    </div>
                    {pack.carPhotoUrl && /^data:image\//i.test(pack.carPhotoUrl) && (
                      <img className="pkg-car-preview" src={pack.carPhotoUrl} alt={`${pack.title} submitted car`} />
                    )}
                  </div>

                  <div className="pkg-card-divider" />

                  {/* ── Controls row ── */}
                  <div className="pkg-card-controls">
                    <label className="pkg-ctrl-field">
                      Status
                      <select
                        name="availabilityStatus"
                        value={selectedStatus}
                        onChange={(e) => setPendingStatus((prev) => ({ ...prev, [pack.id]: e.target.value }))}
                        aria-label={`${pack.title} availability`}
                      >
                        <option value="AVAILABLE">✅ Available (live)</option>
                        <option value="UNAVAILABLE">🔴 Unavailable (hidden)</option>
                        <option value="PENDING_ADMIN_REVIEW">⏳ Pending review</option>
                        <option value="CHANGES_REQUESTED">✏️ Changes requested</option>
                        <option value="REJECTED_BY_COMPANY">❌ Rejected</option>
                        <option value="CANCELLATION_REQUESTED">🚫 Cancellation requested</option>
                      </select>
                    </label>
                    <label className="pkg-ctrl-field pkg-ctrl-field--grow">
                      Admin note
                      <input name="reviewNotes" defaultValue={pack.reviewNotes ?? ""} placeholder="Internal note for this package" aria-label={`${pack.title} admin note`} />
                    </label>

                    {/* Hidden passthrough fields */}
                    <input name="carPhotoUrl" type="hidden" value={pack.carPhotoUrl ?? ""} />
                    <input name="carNumber" type="hidden" value={pack.carNumber ?? ""} />
                    <input name="carModel" type="hidden" value={pack.carModel ?? ""} />
                    <input name="seatsAvailable" type="hidden" value={pack.seatsAvailable ?? 4} />
                    <input name="providerNotes" type="hidden" value={pack.providerNotes ?? ""} />

                    <div className="pkg-ctrl-actions">
                      <label className="admin-check">
                        <input name="featured" type="checkbox" defaultChecked={pack.featured} />
                        Featured
                      </label>
                      <button
                        className={`pkg-save-btn ${selectedStatus === "UNAVAILABLE" ? "pkg-save-btn--danger" : "primary-button"}`}
                        type="submit"
                      >
                        {saveLabel}
                      </button>
                    </div>
                  </div>

                  </fieldset>

                </form>
            ))()}
          </div>
        </div>
      </div>
    );
  }

  function renderReview() {
    return (
      <div className="ops-panel">
        <div className="panel-title-row">
          <div>
            <h3>Package verification queue</h3>
            <p className="muted">{pendingPackages.length} packages currently need explicit admin review.</p>
          </div>
        </div>
        {pendingPackages.length === 0 ? <p className="muted">No package review items. Provider updates are publishing directly to customers.</p> : pendingPackages.map((pack) => (
          <div className="queue-row package-review-row" key={pack.id}>
            <div>
              <strong>{pack.title}</strong>
              <span>{pack.destination} - {statusText(pack.carType)} - {statusText(pack.availabilityStatus)}</span>
              <small>{pack.providerBusinessName ?? "Provider submitted"} - {pack.localPlaces ?? pack.summary}</small>
              <small>Licence: {pack.licenseNumber ?? "Not provided"} {pack.licenseHolderName ? `- ${pack.licenseHolderName}` : ""}</small>
              <small>Rate: {pack.pricePerKm ? `INR ${pack.pricePerKm}/km` : "Not set by provider"}{pack.distanceKm ? ` · Est. ${pack.distanceKm} km` : ""}{pack.providerPayout ? ` · Payout INR ${pack.providerPayout}` : ""}</small>
              <div className="pkg-doc-row">
                {pack.carPhotoUrl ? <a className="pkg-doc-ok" href={pack.carPhotoUrl} target="_blank" rel="noreferrer">View car photo</a> : <span className="pkg-doc-missing">Car photo missing</span>}
                {pack.licenseDocumentUrl ? <a className="pkg-doc-ok" href={pack.licenseDocumentUrl} target="_blank" rel="noreferrer">View licence</a> : <span className="pkg-doc-missing">Licence missing</span>}
                {pack.rcDocumentUrl ? <a className="pkg-doc-ok" href={pack.rcDocumentUrl} target="_blank" rel="noreferrer">View RC</a> : <span className="pkg-doc-missing">RC missing</span>}
              </div>
              {pack.reviewNotes && <small className="pkg-review-note">Update message: {pack.reviewNotes}</small>}
              {(pack.providerCompletedCount ?? 0) > 0 && (
                <span className="provider-history-badge">
                  Verified provider — {pack.providerCompletedCount} completed package{pack.providerCompletedCount === 1 ? "" : "s"}
                </span>
              )}
              {pack.repostedFromId && (
                <span className="repost-indicator">Repost of a previously completed package</span>
              )}
            </div>
            <div className="row-actions">
              <button className="outline-button" type="button" onClick={() => reviewPackage(pack.id, "NEEDS_CHANGES")}>Request changes</button>
              <button className="outline-button" type="button" onClick={() => reviewPackage(pack.id, "REJECTED")}>Reject</button>
              <button className="primary-button" type="button" onClick={() => reviewPackage(pack.id, "APPROVED")}>Approve</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSupport() {
    return (
      <div className="ops-panel split-panel">
        <section>
          <h3>Support oversight</h3>
          {tickets.length === 0 && <p className="muted">No support tickets yet.</p>}
          {tickets.map((ticket) => (
            <div className="status-line" key={ticket.id}>
              <strong>{ticket.subject}</strong>
              <span>{ticket.category} - {ticket.priority} - {ticket.status}</span>
            </div>
          ))}
        </section>
        <section>
          <h3>Feedback moderation</h3>
          {feedback.length === 0 && <p className="muted">No feedback submitted yet.</p>}
          {feedback.map((item) => (
            <div className="status-line" key={item.id}>
              <strong>Package {item.packageRating}/5 - Provider {item.providerRating}/5 - Support {item.supportRating}/5</strong>
              <span>{item.comment || "No written comment."}</span>
              <span>{item.moderationStatus}</span>
              <div className="row-actions">
                <button className="outline-button" type="button" onClick={() => void moderateFeedback(item.id, "REJECTED")}>Reject</button>
                <button className="primary-button" type="button" onClick={() => void moderateFeedback(item.id, "APPROVED")}>Approve</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  function renderContent() {
    return (
      <div className="ops-panel">
        <div className="panel-title-row">
          <div>
            <h3>Website content control</h3>
            <p className="muted">Operational pages only. Keep marketing copy separate from booking and verification work.</p>
          </div>
        </div>
        <div className="content-editor-grid">
          {contentPages.map((page) => (
            <form className="content-editor-card" key={page.slug} onSubmit={(event) => saveContent(event, page.slug)}>
              <strong>{page.slug.replace(/-/g, " ")}</strong>
              <input name="title" defaultValue={page.title} aria-label={`${page.slug} title`} />
              <textarea name="summary" defaultValue={page.summary} aria-label={`${page.slug} summary`} />
              <textarea name="body" defaultValue={page.body} aria-label={`${page.slug} body`} />
              <input name="contactEmail" defaultValue={page.contactEmail ?? ""} placeholder="Contact email" aria-label={`${page.slug} contact email`} />
              <input name="contactPhone" defaultValue={page.contactPhone ?? ""} placeholder="Contact phone" aria-label={`${page.slug} contact phone`} />
              <input name="supportHours" defaultValue={page.supportHours ?? ""} placeholder="Support hours" aria-label={`${page.slug} support hours`} />
              <label className="consent-line"><input name="published" type="checkbox" defaultChecked={page.published} />Published</label>
              <button className="primary-button" type="submit">Save content</button>
            </form>
          ))}
        </div>
      </div>
    );
  }

  function renderAudit() {
    return (
      <div className="ops-panel">
        <div className="panel-title-row">
          <div>
            <h3>Recent audit activity</h3>
            <p className="muted">{audit.length} recorded system events.</p>
          </div>
        </div>
        {audit.length === 0 && <p className="muted">No audit events yet.</p>}
        {audit.length > 0 && (
          <div className="admin-table admin-audit-table">
            <div className="admin-table-head"><span>Action</span><span>Entity</span><span>Actor</span><span>Reason</span><span>Time</span></div>
            {audit.map((item) => (
              <div className="admin-table-row" key={item.id}>
                <div><strong>{item.action}</strong><small>{statusText(item.newState ?? item.previousState ?? "Recorded")}</small></div>
                <div><span>{item.entityType}</span><small>{dash(item.entityId)}</small></div>
                <div><span>{item.actorRole ?? "SYSTEM"}</span><small>{dash(item.actorId)}</small></div>
                <div><span>{dash(item.reason)}</span></div>
                <div><span>{formatDate(item.createdAt)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderSection() {
    switch (activeSection) {
      case "customers": return renderCustomers();
      case "providers": return renderProviders();
      case "bookings": return renderBookings();
      case "packages": return renderPackages();
      case "review": return renderReview();
      case "support": return renderSupport();
      case "content": return renderContent();
      case "audit": return renderAudit();
      default: return renderOverview();
    }
  }

  return (
    <div className="page admin-workspace-page">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Admin sections">
        <div className="admin-sidebar-head">
          <div>
            <strong>Admin portal</strong>
            <small>Operations menu</small>
          </div>
          <button className="icon-button admin-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close admin menu">
            <X size={18} />
          </button>
        </div>
        <nav className="admin-nav">
          {sections.map((section) => (
            <button
              className={section.id === activeSection ? "active" : ""}
              key={section.id}
              type="button"
              onClick={() => openSection(section.id)}
              aria-current={section.id === activeSection ? "page" : undefined}
            >
              <span className="admin-nav-icon">{section.icon}</span>
              <span><strong>{section.label}</strong></span>
              <b>{section.count}</b>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <button className="admin-sidebar-scrim" type="button" aria-label="Close admin menu" onClick={() => setSidebarOpen(false)} />}

      <main className="admin-main">
        <div className="admin-mobilebar">
          <button className="icon-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open admin menu">
            <Menu size={19} />
          </button>
          <strong>{currentSection.label}</strong>
        </div>

        <div className="dashboard-heading admin-workspace-heading">
          <div>
            <span className="eyebrow">ADMIN</span>
            <h1>{currentSection.label}</h1>
            <p className="muted">{currentSection.description}</p>
          </div>
          <Link className="primary-button" to="/support">Support ops<ArrowRight size={17} /></Link>
        </div>

        {message && <div className="notice-panel admin-message">{message}</div>}
        <div className="admin-section-view">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

export function SupportDashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    api.get<SupportTicket[]>("/support/tickets").then(setTickets).catch(() => setTickets([]));
  }, []);

  return (
    <DashboardShell title="Support operations" role="SUPPORT" actionTo="/admin" actionLabel="Control center">
      <Metric icon={<LifeBuoy />} label="Open tickets" value={`${tickets.length}`} tone="blue" />
      <Metric icon={<Clock3 />} label="SLA risk" value={`${tickets.filter((ticket) => ticket.priority === "HIGH" || ticket.priority === "EMERGENCY").length}`} tone="amber" />
      <Metric icon={<UsersRound />} label="Emergency cases" value={`${tickets.filter((ticket) => ticket.priority === "EMERGENCY").length}`} tone="red" />
      <div className="ops-panel">
        <h3>Live incident queue</h3>
        {tickets.length === 0 && <p className="muted">No tickets yet. Provider no-show, travel disruption, medical emergency, and urgent reassignment flows are ready.</p>}
        {tickets.map((ticket) => (
          <div className="status-line" key={ticket.id}>
            <strong>{ticket.subject}</strong>
            <span>{ticket.category} - {ticket.priority} - {ticket.status}</span>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

function getUserFriendlyError(exception: unknown, fallback: string) {
  if (!(exception instanceof Error)) return fallback;
  const message = exception.message.trim();
  if (!message) return fallback;
  if (/failed to fetch|networkerror|load failed/i.test(message)) return "Server is not reachable.";
  if (/internal_error|something went wrong/i.test(message)) return "Server error. Try again.";
  if (/email.*not registered|email_not_registered/i.test(message)) return "Email not registered.";
  if (/wrong password|wrong_password/i.test(message)) return "Wrong password.";
  if (/invalid email or password/i.test(message)) return "Wrong email or password.";
  if (/account not found|user_not_found/i.test(message)) return "Account not found.";
  if (/verification code.*incorrect|otp_invalid/i.test(message)) return "Wrong verification code.";
  if (/verification code expired|otp_expired/i.test(message)) return "Verification code expired.";
  if (/please correct the highlighted fields/i.test(message)) return "Enter registered email or mobile.";
  return message;
}

export function ChangeAdminIdPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentAdminId, setCurrentAdminId] = useState(user?.email ?? "");
  const [newAdminId, setNewAdminId] = useState("");
  const [currentOtp, setCurrentOtp] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [step, setStep] = useState<"currentRequest" | "currentVerify" | "newRequest" | "newVerify">("currentRequest");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      if (!user?.email) {
        const result = recoverySchema.safeParse({ identity: currentAdminId });
        if (!result.success) {
          setFieldErrors({ currentAdminId: getFieldErrors(result.error).identity });
          return;
        }
      }
      const adminIdToChange = user?.email ?? currentAdminId.trim();

      if (step === "currentRequest") {
        await api.post("/auth/admin-id/change/request-otp", {
          currentAdminId: adminIdToChange
        });
        setNotice("Verification code sent to current email.");
        setStep("currentVerify");
        return;
      }

      if (step === "currentVerify") {
        if (!currentOtp.trim()) {
          setFieldErrors({ currentOtp: "Enter the verification code sent to your current email." });
          return;
        }

        await api.post("/auth/admin-id/change/confirm-current", {
          currentAdminId: adminIdToChange,
          otp: currentOtp.trim()
        });
        setNotice("Current email verified. Enter the new email address.");
        setStep("newRequest");
        return;
      }

      const result = recoverySchema.safeParse({ identity: newAdminId });
      if (!result.success) {
        setFieldErrors({ newAdminId: getFieldErrors(result.error).identity });
        return;
      }

      if (step === "newRequest") {
        await api.post("/auth/admin-id/change/request-new-otp", {
          currentAdminId: adminIdToChange,
          newAdminId: result.data.identity
        });
        setNotice("Verification code sent to new email.");
        setStep("newVerify");
        return;
      }

      if (!newOtp.trim()) {
        setFieldErrors({ newOtp: "Enter the verification code sent to your new email." });
        return;
      }

      await api.post("/auth/admin-id/change/confirm", {
        currentAdminId: adminIdToChange,
        newAdminId: result.data.identity,
        otp: newOtp.trim()
      });
      if (user) {
        logout();
      }
      navigate("/login");
    } catch (exception) {
      setError(getUserFriendlyError(exception, "Unable to update email."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page padded-page">
      <section className="auth-card">
        <img className="auth-card-logo" src="/carhub-logo.png" alt="CarHub" />
        <span className="eyebrow"><ShieldCheck size={17} />Secure admin settings</span>
        <h1>Change admin email</h1>
        <p>Verify your current email first, then verify the new email before it replaces the login ID.</p>
        <form className="stacked-form" onSubmit={submit}>
          {!user && (
            <FormField name="currentAdminId" error={fieldErrors.currentAdminId}>
              <input
                name="currentAdminId"
                placeholder="Current admin email"
                type="email"
                autoComplete="email"
                value={currentAdminId}
                onChange={(event) => setCurrentAdminId(event.target.value)}
                aria-invalid={Boolean(fieldErrors.currentAdminId)}
                aria-describedby="currentAdminId-error"
                disabled={step !== "currentRequest"}
              />
            </FormField>
          )}
          {step === "currentVerify" && (
            <FormField name="currentOtp" error={fieldErrors.currentOtp}>
              <input
                name="currentOtp"
                placeholder="Current email verification code"
                type="text"
                autoComplete="one-time-code"
                value={currentOtp}
                onChange={(event) => setCurrentOtp(event.target.value)}
                aria-invalid={Boolean(fieldErrors.currentOtp)}
                aria-describedby="currentOtp-error"
              />
            </FormField>
          )}
          {(step === "newRequest" || step === "newVerify") && (
            <FormField name="newAdminId" error={fieldErrors.newAdminId}>
              <input
                name="newAdminId"
                placeholder="New admin email"
                type="email"
                autoComplete="off"
                value={newAdminId}
                onChange={(event) => setNewAdminId(event.target.value)}
                aria-invalid={Boolean(fieldErrors.newAdminId)}
                aria-describedby="newAdminId-error"
                disabled={step === "newVerify"}
              />
            </FormField>
          )}
          {step === "newVerify" && (
            <FormField name="newOtp" error={fieldErrors.newOtp}>
              <input
                name="newOtp"
                placeholder="New email verification code"
                type="text"
                autoComplete="one-time-code"
                value={newOtp}
                onChange={(event) => setNewOtp(event.target.value)}
                aria-invalid={Boolean(fieldErrors.newOtp)}
                aria-describedby="newOtp-error"
              />
            </FormField>
          )}
          {error && <div className="error-box"><span>{error}</span></div>}
          {notice && <div className="notice-panel"><span>{notice}</span></div>}
          <button className="primary-button auth-submit-button" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : step === "currentRequest"
                ? "Send OTP to current email"
                : step === "currentVerify"
                  ? "Verify current email"
                  : step === "newRequest"
                    ? "Send OTP to new email"
                    : "Verify new email and update"}
          </button>
        </form>
        <div className="auth-switch-panel">
          <Link className="forgot-link" to={user ? "/admin" : "/login"}>
            {user ? "Return to admin dashboard" : "Go back"}
          </Link>
        </div>
      </section>
    </div>
  );
}

export function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      if (!user?.email) {
        throw new Error("Admin session is not available.");
      }

      if (step === "request") {
        if (!currentPassword.trim()) {
          setFieldErrors({ currentPassword: "Enter your current password." });
          return;
        }
        if (!newPassword) {
          setFieldErrors({ newPassword: "Enter your new password." });
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("The new password and confirmation do not match.");
          return;
        }

        await api.post("/auth/password/change/request-otp", {
          email: user.email,
          currentPassword,
          newPassword
        });
        setNotice("A one-time verification code has been sent to your admin email.");
        setStep("verify");
        return;
      }

      if (!otp.trim()) {
        setError("Enter the verification code sent to your email.");
        return;
      }

      await api.post("/auth/password/change/confirm", {
        email: user.email,
        otp,
        newPassword
      });
      setNotice("Password updated successfully. Signing out to re-authenticate.");
      logout();
      navigate("/login");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page padded-page">
      <section className="auth-card">
        <span className="eyebrow"><ShieldCheck size={17} />Secure admin settings</span>
        <h1>Change admin password</h1>
        <p>Update your admin credentials using an email OTP. This keeps the control center secure after the first sign-in.</p>
        <form className="stacked-form" onSubmit={submit}>
          <FormField name="currentPassword" error={fieldErrors.currentPassword}>
            <input
              name="currentPassword"
              placeholder="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.currentPassword)}
              aria-describedby="currentPassword-error"
            />
          </FormField>
          <FormField name="newPassword" error={fieldErrors.newPassword}>
            <input
              name="newPassword"
              placeholder="New password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.newPassword)}
              aria-describedby="newPassword-error"
            />
          </FormField>
          <FormField name="confirmPassword" error={fieldErrors.confirmPassword}>
            <input
              name="confirmPassword"
              placeholder="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby="confirmPassword-error"
            />
          </FormField>
          {step === "verify" && (
            <FormField name="otp" error={fieldErrors.otp}>
              <input
                name="otp"
                placeholder="Verification code"
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                aria-invalid={Boolean(fieldErrors.otp)}
                aria-describedby="otp-error"
              />
            </FormField>
          )}
          {error && <div className="error-box"><span>{error}</span></div>}
          {notice && <div className="notice-panel"><span>{notice}</span></div>}
          <button className="primary-button auth-submit-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : step === "request" ? "Send OTP to email" : "Confirm OTP and update"}
          </button>
        </form>
        <div className="auth-switch-panel">
          <Link className="forgot-link" to="/admin">
            Return to admin dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function DashboardShell({ title, role, actionTo, actionLabel, children }: { title: string; role: string; actionTo: string; actionLabel: string; children: ReactNode }) {
  return (
    <div className="page padded-page dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">{role}</span>
          <h1>{title}</h1>
        </div>
        <Link className="primary-button" to={actionTo}>{actionLabel}<ArrowRight size={17} /></Link>
      </div>
      <div className="metric-grid">{children}</div>
    </div>
  );
}

function Metric({ icon, label, value, tone, onClick }: { icon: ReactNode; label: string; value: string; tone: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="metric-icon">{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </>
  );

  if (onClick) {
    return (
      <button className={`metric-card metric-card-action ${tone}`} type="button" onClick={onClick} aria-label={`Open ${label}`}>
        {content}
      </button>
    );
  }

  return (
    <article className={`metric-card ${tone}`}>
      {content}
    </article>
  );
}

export function NotFoundPage() {
  return (
    <div className="page padded-page">
      <section className="static-panel">
        <h1>Page not found</h1>
        <Link className="primary-button" to="/admin">Return to admin</Link>
      </section>
    </div>
  );
}
