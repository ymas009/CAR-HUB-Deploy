import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ArrowRight, Clock3, EyeOff, LifeBuoy, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { api } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { ApiPackage, ApiRequest, AuditLogItem, ContentPage, FeedbackItem, ProviderProfile, RequestStatus, SupportTicket } from "../types";

const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid admin email address."),
  password: z.string().min(1, "Password is required.")
});

const recoverySchema = z.object({
  identity: z.string().trim().email("Enter the registered admin email address.")
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

export function AuthPage({ mode }: { mode: "login" | "register" | "forgot" }) {
  const { login, loginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/admin";
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
        const result = recoverySchema.safeParse({ identity: String(form.get("identity") ?? "") });
        if (!result.success) {
          setFieldErrors(getFieldErrors(result.error));
          return;
        }
        setNotice("Admin password recovery is ready for email/SMS provider integration.");
        return;
      }
      const result = adminLoginSchema.safeParse({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? "")
      });
      if (!result.success) {
        setFieldErrors(getFieldErrors(result.error));
        return;
      }
      await login(result.data.email, result.data.password);
      navigate(returnTo);
    } catch (exception) {
      setError("Admin sign in failed. Please check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function demo() {
    setError("");
    setNotice("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await loginAs("ADMIN");
      navigate("/admin");
    } catch {
      setError("Start the backend and database to use the seeded admin account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <span className="eyebrow"><LockKeyhole size={17} />Company control center</span>
        <h1>{mode === "forgot" ? "Recover admin access" : "Welcome back"}</h1>
        <p>Sign in to review requests, control provider sharing, monitor support, and audit operational actions.</p>
        <form className="stacked-form" onSubmit={submit}>
          {mode !== "forgot" && (
            <FormField name="email" error={fieldErrors.email}>
              <input name="email" placeholder="Admin email" type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby="email-error" />
            </FormField>
          )}
          {mode !== "forgot" && (
            <FormField name="password" error={fieldErrors.password}>
              <input name="password" placeholder="Password" type="password" autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby="password-error" />
            </FormField>
          )}
          {mode === "forgot" && (
            <FormField name="identity" error={fieldErrors.identity}>
              <input name="identity" placeholder="Registered admin email" autoComplete="email" aria-invalid={Boolean(fieldErrors.identity)} aria-describedby="identity-error" />
            </FormField>
          )}
          {error && <div className="error-box"><span>{error}</span></div>}
          {notice && <div className="notice-panel">{notice}</div>}
          <button className="primary-button auth-submit-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "forgot" ? "Request recovery" : "Sign in securely"}
          </button>
        </form>
        <div className="role-switcher" aria-label="Seeded demo role shortcut">
          <button onClick={demo} disabled={submitting}>Admin demo</button>
        </div>
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

export function AdminDashboard() {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [audit, setAudit] = useState<AuditLogItem[]>([]);
  const [pendingPackages, setPendingPackages] = useState<ApiPackage[]>([]);
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [message, setMessage] = useState("");

  async function loadAdminWorkspace() {
    const [requestData, providerData, ticketData, feedbackData, auditData, pendingPackageData, contentPageData] = await Promise.all([
      api.get<ApiRequest[]>("/admin/requests").catch(() => []),
      api.get<ProviderProfile[]>("/admin/providers").catch(() => []),
      api.get<SupportTicket[]>("/support/tickets").catch(() => []),
      api.get<FeedbackItem[]>("/admin/feedback").catch(() => []),
      api.get<AuditLogItem[]>("/admin/audit").catch(() => []),
      api.get<ApiPackage[]>("/admin/packages/pending").catch(() => []),
      api.get<ContentPage[]>("/admin/content").catch(() => [])
    ]);
    setRequests(requestData);
    setProviders(providerData);
    setTickets(ticketData);
    setFeedback(feedbackData);
    setAudit(auditData);
    setPendingPackages(pendingPackageData);
    setContentPages(contentPageData);
  }

  useEffect(() => { void loadAdminWorkspace(); }, []);

  async function review(requestId: string, decision: RequestStatus) {
    try {
      await api.post<ApiRequest>(`/admin/requests/${requestId}/review`, {
        decision,
        reason: `Admin marked ${decision}`,
        adminNotes: "Reviewed in CarHub control center"
      });
      setMessage(`Request moved to ${decision.replace(/_/g, " ")}.`);
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Admin review action failed.");
    }
  }

  async function share(requestId: string) {
    const providerId = providers[0]?.id;
    if (!providerId) {
      setMessage("No approved provider found. Start backend with seed data.");
      return;
    }
    try {
      await api.post(`/admin/requests/${requestId}/provider-share`, {
        providerId,
        visibleFields: ["destination", "travelersCount", "travelWindow", "companyContactWindow"],
        maskedPayload: {
          destination: "Execution area shared after admin review",
          travelersCount: requests.find((request) => request.id === requestId)?.travelersCount,
          customerContact: "Company-coordinated only"
        },
        purpose: "Approved execution only"
      });
      setMessage("Provider received only the scoped masked payload.");
      await loadAdminWorkspace();
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Provider sharing failed.");
    }
  }

  async function reviewPackage(packageId: string, decision: "APPROVED" | "REJECTED" | "NEEDS_CHANGES") {
    try {
      await api.post<ApiPackage>(`/admin/packages/${packageId}/review`, {
        decision,
        reviewNotes: decision === "APPROVED"
          ? "Approved for public catalog after company review."
          : decision === "NEEDS_CHANGES"
            ? "Provider must improve package details before approval."
            : "Rejected by company review.",
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

  return (
    <DashboardShell title="Company control center" role="ADMIN" actionTo="/support" actionLabel="Support ops">
      <Metric icon={<ShieldCheck />} label="Requests awaiting review" value={`${requests.length}`} tone="blue" />
      <Metric icon={<EyeOff />} label="Provider data locked" value="100%" tone="green" />
      <Metric icon={<LifeBuoy />} label="Package proposals" value={`${pendingPackages.length}`} tone="amber" />
      <div className="ops-panel">
        <h3>Provider package approval</h3>
        {message && <p className="trust-note">{message}</p>}
        {pendingPackages.length === 0 && <p className="muted">No provider package proposals awaiting review.</p>}
        {pendingPackages.map((pack) => (
          <div className="queue-row package-review-row" key={pack.id}>
            <div>
              <strong>{pack.title}</strong>
              <span>{pack.destination} - {pack.category} - {pack.currency} {Number(pack.startingPrice).toLocaleString("en-IN")}</span>
              <small>{pack.providerBusinessName ?? "Provider submitted"} - {pack.summary}</small>
            </div>
            <div className="row-actions">
              <button className="outline-button" onClick={() => reviewPackage(pack.id, "NEEDS_CHANGES")}>Request changes</button>
              <button className="outline-button" onClick={() => reviewPackage(pack.id, "REJECTED")}>Reject</button>
              <button className="primary-button" onClick={() => reviewPackage(pack.id, "APPROVED")}>Approve public</button>
            </div>
          </div>
        ))}
      </div>
      <div className="ops-panel">
        <h3>Approval queue</h3>
        {requests.length === 0 && <p className="muted">No requests yet.</p>}
        {requests.map((request) => (
          <div className="queue-row" key={request.id}>
            <span>{request.destination} - {request.status.replace(/_/g, " ")}</span>
            <div className="row-actions">
              <button className="outline-button" onClick={() => review(request.id, "UNDER_REVIEW")}>Review</button>
              <button className="outline-button" onClick={() => review(request.id, "CLARIFICATION_REQUESTED")}>Clarify</button>
              <button className="outline-button" onClick={() => review(request.id, "APPROVED_BY_COMPANY")}>Approve</button>
              <button className="outline-button" onClick={() => review(request.id, "COMPLETED")}>Complete</button>
              <button className="primary-button" onClick={() => share(request.id)}>Share masked payload</button>
            </div>
          </div>
        ))}
      </div>
      <div className="ops-panel">
        <h3>Website content control</h3>
        <p className="muted">Admin updates here publish to public pages such as About, Contact, Privacy, Terms, and Cancellation Policy.</p>
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
              <label className="consent-line">
                <input name="published" type="checkbox" defaultChecked={page.published} />
                Published
              </label>
              <button className="primary-button" type="submit">Save content</button>
            </form>
          ))}
        </div>
      </div>
      <div className="ops-panel split-panel">
        <section>
          <h3>Support oversight</h3>
          {tickets.length === 0 && <p className="muted">No support tickets yet.</p>}
          {tickets.slice(0, 5).map((ticket) => (
            <div className="status-line" key={ticket.id}>
              <strong>{ticket.subject}</strong>
              <span>{ticket.priority} - {ticket.status}</span>
            </div>
          ))}
        </section>
        <section>
          <h3>Feedback moderation</h3>
          {feedback.length === 0 && <p className="muted">No feedback submitted yet.</p>}
          {feedback.slice(0, 5).map((item) => (
            <div className="status-line" key={item.id}>
              <strong>Package {item.packageRating}/5 - Support {item.supportRating}/5</strong>
              <span>{item.moderationStatus}</span>
            </div>
          ))}
        </section>
      </div>
      <div className="ops-panel">
        <h3>Recent audit activity</h3>
        {audit.length === 0 && <p className="muted">No audit events yet.</p>}
        {audit.slice(0, 8).map((item) => (
          <div className="audit-row" key={item.id}>
            <strong>{item.action}</strong>
            <span>{item.entityType} - {(item.newState ?? item.previousState ?? "RECORDED").replace(/_/g, " ")}</span>
            <small>{item.actorRole ?? "SYSTEM"} {item.reason ? `- ${item.reason}` : ""}</small>
          </div>
        ))}
      </div>
    </DashboardShell>
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

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span className="metric-icon">{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
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
