"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import styles from "./page.module.css";
import type { Client, HumeAgent, PhoneNumber, ClientUser } from "./types";

type AdminSection =
  | "dashboard"
  | "clients"
  | "usage"
  | "integrations"
  | "settings";

const SECTIONS: { id: AdminSection; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "clients", label: "Clients" },
  { id: "usage", label: "Usage & Billing" },
  { id: "integrations", label: "Global Integrations" },
  { id: "settings", label: "Settings" },
];

const CLIENT_TABS = [
  "Overview",
  "Hume Agent",
  "Numbers",
  "Contacts",
  "Leads",
  "Calls",
  "Tasks",
] as const;
type ClientTab = (typeof CLIENT_TABS)[number];

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "TechFlow Solutions",
    industry: "SaaS",
    plan: "pro",
    status: "active",
    contactName: "Sarah M.",
    contactEmail: "sarah@techflow.co.za",
    contactPhone: "+27 82 555 0182",
    timezone: "Africa/Johannesburg",
    HumeAgentCount: 2,
    phoneNumberCount: 3,
    totalCalls: 412,
    callsToday: 8,
    newLeadsToday: 3,
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "UrbanLaw Attorneys",
    industry: "Legal",
    plan: "starter",
    status: "active",
    contactName: "James O.",
    contactEmail: "james@urbanlaw.co.za",
    contactPhone: "+27 11 234 5678",
    timezone: "Africa/Johannesburg",
    HumeAgentCount: 1,
    phoneNumberCount: 1,
    totalCalls: 87,
    callsToday: 2,
    newLeadsToday: 0,
    createdAt: "2026-02-20",
  },
  {
    id: "3",
    name: "MediWell Clinic",
    industry: "Healthcare",
    plan: "pro",
    status: "active",
    contactName: "Dr. Emily T.",
    contactEmail: "emily@mediwell.co.za",
    contactPhone: "+27 83 444 7788",
    timezone: "Africa/Johannesburg",
    HumeAgentCount: 3,
    phoneNumberCount: 5,
    totalCalls: 1204,
    callsToday: 24,
    newLeadsToday: 7,
    createdAt: "2025-11-08",
  },
];

const MOCK_AGENTS: HumeAgent[] = [
  {
    id: "a1",
    clientId: "1",
    name: "Receptionist",
    configId: "hume-prod-abc123",
    greetingScript:
      "Hi, you've reached Luna, how can I help you today?",
    systemPrompt:
      "You are a professional office receptionist. Be polite, gather caller details, and offer to schedule a callback.",
    status: "active",
  },
  {
    id: "a2",
    clientId: "1",
    name: "After-hours",
    configId: "hume-prod-xyz789",
    greetingScript:
      "Our office is currently closed. Please leave a message and we'll call you back.",
    systemPrompt: "After-hours voicemail assistant.",
    status: "active",
  },
];

const MOCK_NUMBERS: PhoneNumber[] = [
  {
    id: "p1",
    clientId: "1",
    number: "+27 11 012 5874",
    agentId: "a1",
    isPrimary: true,
    voiceEnabled: true,
    smsEnabled: true,
    status: "active",
  },
  {
    id: "p2",
    clientId: "1",
    number: "+27 11 012 9900",
    agentId: "a2",
    isPrimary: false,
    voiceEnabled: true,
    smsEnabled: false,
    status: "active",
  },
];

const MOCK_USERS: ClientUser[] = [
  {
    id: "u1",
    clientId: "1",
    name: "Sarah M.",
    email: "sarah@techflow.co.za",
    role: "owner",
  },
  {
    id: "u2",
    clientId: "1",
    name: "Tom R.",
    email: "tom@techflow.co.za",
    role: "member",
  },
];

const MOCK_CONTACTS = [
  { id: "c1", fullName: "Daniel Martin", phoneE164: "+27 82 555 0182", email: "daniel@client.co.za", source: "Phone call", lastSeenAt: "2026-03-19T10:42:00Z" },
  { id: "c2", fullName: "Emily Thompson", phoneE164: "+27 84 512 9900", email: "emily@client.co.za", source: "Website form", lastSeenAt: "2026-03-19T09:58:00Z" },
  { id: "c3", fullName: "Mark Reynolds", phoneE164: "+27 72 611 2233", email: "mark@client.co.za", source: "Phone call", lastSeenAt: "2026-03-18T14:20:00Z" },
];

const MOCK_LEADS = [
  { id: "l1", name: "Emily Thompson", phone: "+27 84 512 9900", topic: "Demo request", preferredCallbackTime: "Weekdays after 14:00", status: "new", createdAt: "2026-03-19T09:58:00Z" },
  { id: "l2", name: "Mark Reynolds", phone: "+27 72 611 2233", topic: "Pricing inquiry", preferredCallbackTime: "", status: "contacted", createdAt: "2026-03-18T14:20:00Z" },
  { id: "l3", name: "Sarah Klein", phone: "+27 83 777 4433", topic: "Appointment request", preferredCallbackTime: "Tomorrow", status: "qualified", createdAt: "2026-03-17T11:05:00Z" },
];

const MOCK_CALLS = [
  { id: "call1", direction: "inbound", contactName: "Daniel Martin", contactPhone: "+27 82 555 0182", durationSeconds: 134, startedAt: "2026-03-19T10:42:00Z", outcome: "completed", summary: "Caller inquired about pricing for the Pro plan. Interested in a demo next week.", hasTranscript: true },
  { id: "call2", direction: "inbound", contactName: "Unknown", contactPhone: "+27 11 234 5678", durationSeconds: 0, startedAt: "2026-03-19T09:15:00Z", outcome: "missed", summary: null, hasTranscript: false },
  { id: "call3", direction: "inbound", contactName: "James O'Connor", contactPhone: "+27 83 444 7788", durationSeconds: 93, startedAt: "2026-03-18T16:30:00Z", outcome: "voicemail", summary: "Left a voicemail requesting a callback regarding contract review.", hasTranscript: true },
  { id: "call4", direction: "outbound", contactName: "Emily Thompson", contactPhone: "+27 84 512 9900", durationSeconds: 242, startedAt: "2026-03-19T09:58:00Z", outcome: "completed", summary: "Follow-up call. Client confirmed interest and wants to schedule a demo for Thursday.", hasTranscript: true },
];

// ─── Root admin page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>("Overview");
  const [showNewClient, setShowNewClient] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  async function loadClients() {
    setClientsLoading(true);
    setClientsError("");

    try {
      const data = await requestJson<Client[]>("/api/clients");
      setClients(data);
      if (selectedClientId && !data.some((client) => client.id === selectedClientId)) {
        setSelectedClientId(null);
      }
    } catch (error) {
      setClientsError(error instanceof Error ? error.message : "Could not load clients");
    } finally {
      setClientsLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  return (
    <div className={styles.layout}>
      <AdminSidebar
        sections={SECTIONS}
        active={section}
        onSelect={(id) => {
          setSection(id as AdminSection);
          setSelectedClientId(null);
        }}
      />

      <main className={styles.main}>
        <TopBar />

        <div className={styles.content}>
          {clientsError ? (
            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Admin data unavailable</h3>
              <p className={styles.sectionDesc}>{clientsError}</p>
              <button className={styles.btnPrimary} type="button" onClick={() => void loadClients()}>
                Retry
              </button>
            </div>
          ) : null}

          {clientsLoading ? (
            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Loading admin workspace…</h3>
            </div>
          ) : null}

          {!clientsLoading && section === "dashboard" && (
            <DashboardSection clients={clients} onViewClient={(id) => { setSelectedClientId(id); setSection("clients"); }} />
          )}
          {!clientsLoading && section === "clients" && !selectedClient && (
            <ClientsSection
              clients={clients}
              onSelect={(c) => { setSelectedClientId(c.id); setClientTab("Overview"); }}
              onNew={() => setShowNewClient(true)}
            />
          )}
          {!clientsLoading && section === "clients" && selectedClient && (
            <ClientDetailSection
              client={selectedClient}
              onBack={() => setSelectedClientId(null)}
              activeTab={clientTab}
              onTabChange={setClientTab}
              onClientUpdated={() => void loadClients()}
            />
          )}
          {!clientsLoading && section === "usage" && <UsageSection clients={clients} />}
          {section === "integrations" && <IntegrationsSection />}
          {section === "settings" && <SettingsSection />}
        </div>
      </main>

      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onCreate={(c) => {
            setClients((current) => [c, ...current]);
            setShowNewClient(false);
            setSelectedClientId(c.id);
            setClientTab("Overview");
          }}
        />
      )}
    </div>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <span className={styles.logo}>Luna</span>
        <span className={styles.breadcrumb}>Admin</span>
      </div>
      <div className={styles.topBarRight}>
        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          <span>All systems operational</span>
        </div>
        <div className={styles.avatar}>AD</div>
      </div>
    </header>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection({
  clients,
  onViewClient,
}: {
  clients: Client[];
  onViewClient: (id: string) => void;
}) {
  const totalCalls = clients.reduce((s, c) => s + c.totalCalls, 0);
  const totalToday = clients.reduce((s, c) => s + c.callsToday, 0);
  const totalLeads = clients.reduce((s, c) => s + c.newLeadsToday, 0);
  const activeClients = clients.filter((c) => c.status === "active").length;

  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <div className={styles.statsGrid}>
        <StatCard label="Active Clients" value={String(activeClients)} delta={`of ${clients.length} total`} />
        <StatCard label="Calls Today" value={String(totalToday)} delta={`${totalCalls.toLocaleString()} total`} />
        <StatCard label="New Leads Today" value={String(totalLeads)} delta="Across all clients" />
        <StatCard label="Revenue (MRR)" value="R4,200" delta="+R800 this month" />
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Clients</h2>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Plan</th>
              <th>AI Agents</th>
              <th>Numbers</th>
              <th>Calls / today</th>
              <th>Leads today</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="cursor-pointer" onClick={() => onViewClient(c.id)}>
                <td>
                  <div className={styles.clientCell}>
                    <div className={styles.clientAvatar}>{c.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <p className={styles.tdName}>{c.name}</p>
                      <p className={styles.tdMuted}>{c.industry}</p>
                    </div>
                  </div>
                </td>
                <td><span className={`tag ${c.plan === "pro" ? "tag-blue" : "tag-amber"}`}>{c.plan}</span></td>
                <td>{c.HumeAgentCount}</td>
                <td>{c.phoneNumberCount}</td>
                <td>{c.callsToday} <span className={styles.tdMuted}>/ {c.totalCalls}</span></td>
                <td>{c.newLeadsToday}</td>
                <td><span className="tag tag-green">● {c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Clients list ────────────────────────────────────────────────────────────

function ClientsSection({
  clients,
  onSelect,
  onNew,
}: {
  clients: Client[];
  onSelect: (c: Client) => void;
  onNew: () => void;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <h1 className={styles.pageTitle}>Clients</h1>
        <button className={styles.btnPrimary} onClick={onNew}>+ New Client</button>
      </div>

      <div className={styles.clientCards}>
        {clients.map((c) => (
          <div key={c.id} className={styles.clientCard} onClick={() => onSelect(c)}>
            <div className={styles.clientCardHeader}>
              <div className={styles.clientAvatarLarge}>{c.name.slice(0, 2).toUpperCase()}</div>
              <div className={styles.clientCardMeta}>
                <h3 className={styles.clientCardName}>{c.name}</h3>
                <p className={styles.clientCardIndustry}>{c.industry} · {c.contactEmail}</p>
              </div>
              <span className={`tag ${c.plan === "pro" ? "tag-blue" : "tag-amber"}`}>{c.plan}</span>
            </div>

            <div className={styles.clientCardStats}>
              {[
                { val: c.HumeAgentCount, lbl: "Agents" },
                { val: c.phoneNumberCount, lbl: "Numbers" },
                { val: c.callsToday, lbl: "Calls today" },
                { val: c.totalCalls, lbl: "Total calls" },
              ].map((s) => (
                <div key={s.lbl} className={styles.clientCardStat}>
                  <span className={styles.clientCardStatVal}>{s.val}</span>
                  <span className={styles.clientCardStatLbl}>{s.lbl}</span>
                </div>
              ))}
            </div>

            <div className={styles.clientCardFooter}>
              <span className="tag tag-green">● {c.status}</span>
              <span className={styles.tdMuted}>Since {c.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Client detail ───────────────────────────────────────────────────────────

function ClientDetailSection({
  client,
  onBack,
  activeTab,
  onTabChange,
  onClientUpdated,
}: {
  client: Client;
  onBack: () => void;
  activeTab: ClientTab;
  onTabChange: (t: ClientTab) => void;
  onClientUpdated: () => void;
}) {
  return (
    <div className={styles.section}>
      {/* Header */}
      <button className={styles.backBtn} onClick={onBack}>← All Clients</button>

      <div className={styles.clientDetailHeader}>
        <div className={styles.clientAvatarLarge}>{client.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <h1 className={styles.clientDetailName}>{client.name}</h1>
          <p className={styles.clientDetailMeta}>{client.industry} · {client.contactEmail}</p>
        </div>
        <div className={styles.clientDetailStats}>
          <StatBadge label="Calls Today" value={client.callsToday} />
          <StatBadge label="Total Calls" value={client.totalCalls} />
          <StatBadge label="New Leads" value={client.newLeadsToday} />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.detailTabs}>
        {CLIENT_TABS.map((t) => (
          <button
            key={t}
            className={`${styles.detailTab} ${activeTab === t ? styles.detailTabActive : ""}`}
            onClick={() => onTabChange(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && <OverviewTab client={client} />}
      {activeTab === "Hume Agent" && <HumeAgentTab clientId={client.id} onUpdated={onClientUpdated} />}
      {activeTab === "Numbers" && <NumbersTab clientId={client.id} onUpdated={onClientUpdated} />}
      {activeTab === "Contacts" && <ContactsTab clientId={client.id} />}
      {activeTab === "Leads" && <LeadsTab clientId={client.id} />}
      {activeTab === "Calls" && <CallsTab clientId={client.id} />}
      {activeTab === "Tasks" && <TasksTab clientId={client.id} />}
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({ client }: { client: Client }) {
  return (
    <div className={styles.overviewGrid}>
      <div className={styles.infoCard}>
        <h3 className={styles.infoCardTitle}>Business Info</h3>
        <InfoRow label="Name" value={client.name} />
        <InfoRow label="Industry" value={client.industry ?? ""} />
        <InfoRow label="Timezone" value={client.timezone ?? ""} />
        <InfoRow label="Plan" value={client.plan ?? ""} />
        <InfoRow label="Status" value={client.status ?? ""} />
        <InfoRow label="Member since" value={client.createdAt ?? ""} />
      </div>

      <div className={styles.infoCard}>
        <h3 className={styles.infoCardTitle}>Contact</h3>
        <InfoRow label="Name" value={client.contactName ?? ""} />
        <InfoRow label="Email" value={client.contactEmail ?? ""} />
        <InfoRow label="Phone" value={client.contactPhone ?? ""} />
      </div>

      <div className={styles.infoCard} style={{ gridColumn: "1 / -1" }}>
        <ClientAccessPanel clientId={client.id} />
      </div>
    </div>
  );
}

// ─── Client access panel ─────────────────────────────────────────────────────

function ClientAccessPanel({ clientId }: { clientId: string }) {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [copied, setCopied] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("client123");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">("success");
  const [submitting, setSubmitting] = useState(false);
  const [loginUrl, setLoginUrl] = useState("/login");

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError("");

    try {
      const data = await requestJson<ClientUser[]>(`/api/clients/${clientId}/users`);
      setUsers(data);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Could not load client logins");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    setLoginUrl(`${window.location.origin}/login`);
    void loadUsers();
  }, [clientId]);

  const copyUrl = () => {
    navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleCreateUser() {
    if (!newEmail || newPassword.length < 6) return;

    setSubmitting(true);
    setFeedback("");
    setFeedbackTone("success");

    try {
      const created = await requestJson<ClientUser>(`/api/clients/${clientId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });

      setUsers((current) => [...current, created]);
      setNewEmail("");
      setNewPassword("client123");
      setAddingUser(false);
      setFeedback("Client login created.");
      setFeedbackTone("success");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not create login");
      setFeedbackTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!resetUserId || passwordValue.length < 6) return;

    setSubmitting(true);
    setFeedback("");
    setFeedbackTone("success");

    try {
      await requestJson<{ ok: boolean }>(`/api/clients/${clientId}/users/${resetUserId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordValue }),
      });

      setResetUserId(null);
      setPasswordValue("");
      setFeedback("Password reset saved.");
      setFeedbackTone("success");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not reset password");
      setFeedbackTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.accessPanel}>
      <div className={styles.accessPanelHeader}>
        <div className={styles.accessPanelTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <h3>Client Portal Access</h3>
        </div>
      </div>

      {/* Login URL */}
      <div className={styles.loginUrlBox}>
        <p className={styles.loginUrlLabel}>Login URL</p>
        <div className={styles.loginUrlRow}>
          <code className={styles.loginUrlCode}>{loginUrl}</code>
          <button className={styles.iconBtn} onClick={copyUrl} title="Copy URL">
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            )}
          </button>
          <a href={loginUrl} target="_blank" rel="noreferrer">
            <button className={styles.iconBtn} title="Open">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
          </a>
        </div>
      </div>

      {/* Team logins */}
      <div className={styles.usersSection}>
        <p className={styles.usersSectionLabel}>Team logins</p>
        {usersLoading ? <p className={styles.tdMuted}>Loading logins…</p> : null}
        {usersError ? <p style={{ color: "#f87171", fontSize: 12 }}>{usersError}</p> : null}
        {users.map((u) => (
          <div key={u.id} className={styles.userRow}>
            <div className={styles.smallAvatar}>{u.name.split(" ").map((n) => n[0]).join("")}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{u.email}</p>
              <p className={styles.userRole}>{u.role}</p>
            </div>
            <div className={styles.userActions}>
              <button
                className={styles.btnSm}
                type="button"
                onClick={() => { setResetUserId(u.id); setPasswordValue(""); }}
              >
                Reset password
              </button>
            </div>
          </div>
        ))}

        {/* Reset password inline form */}
        {resetUserId && (
          <div className={styles.inlineForm}>
            <p className={styles.inlineFormTitle}>Set new password</p>
            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                style={{ paddingRight: 40 }}
                placeholder="New password (min 6 chars)"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
              />
              <button
                className={styles.passwordToggle}
                type="button"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <div className={styles.inlineFormActions}>
              <button className={styles.btnGhostSm} type="button" onClick={() => setResetUserId(null)}>Cancel</button>
              <button
                className={styles.btnSm}
                type="button"
                onClick={() => void handleResetPassword()}
                disabled={passwordValue.length < 6 || submitting}
              >
                {submitting ? "Saving..." : "Save Password"}
              </button>
            </div>
          </div>
        )}

        {/* Add new user */}
        {addingUser ? (
          <div className={styles.inlineForm}>
            <p className={styles.inlineFormTitle}>Create login</p>
            <input className="input" type="email" placeholder="Email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <input className="input" type="text" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className={styles.inlineFormActions}>
              <button className={styles.btnGhostSm} type="button" onClick={() => setAddingUser(false)}>Cancel</button>
              <button
                className={styles.btnSm}
                type="button"
                onClick={() => void handleCreateUser()}
                disabled={!newEmail || newPassword.length < 6 || submitting}
              >
                {submitting ? "Creating..." : "Create Login"}
              </button>
            </div>
          </div>
        ) : (
          <button className={styles.btnAddUser} type="button" onClick={() => setAddingUser(true)}>
            + Add another login
          </button>
        )}

        {feedback ? (
          <p style={{ color: feedbackTone === "success" ? "#4ade80" : "#f87171", fontSize: 12 }}>
            {feedback}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── Hume Agent tab ──────────────────────────────────────────────────────────

function HumeAgentTab({
  clientId,
  onUpdated,
}: {
  clientId: string;
  onUpdated: () => void;
}) {
  const [agents, setAgents] = useState<HumeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", configId: "", systemPrompt: "", greetingScript: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function loadAgents() {
    setLoading(true);
    setLoadError("");

    try {
      const data = await requestJson<HumeAgent[]>(`/api/clients/${clientId}/hume-agents`);
      setAgents(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load Hume agents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgents();
  }, [clientId]);

  const startEdit = (agent?: HumeAgent) => {
    setSaveError("");
    if (agent) {
      setEditingId(agent.id);
      setForm({ name: agent.name, configId: agent.configId, systemPrompt: agent.systemPrompt ?? "", greetingScript: agent.greetingScript ?? "" });
    } else {
      setEditingId("new");
      setForm({ name: "", configId: "", systemPrompt: "", greetingScript: "" });
    }
  };

  async function save() {
    if (!form.name.trim() || !form.configId.trim()) {
      setSaveError("Agent name and Hume Config ID are required.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const url =
        editingId === "new"
          ? `/api/clients/${clientId}/hume-agents`
          : `/api/clients/${clientId}/hume-agents/${editingId}`;
      const method = editingId === "new" ? "POST" : "PUT";
      const saved = await requestJson<HumeAgent>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setAgents((prev) =>
        editingId === "new"
          ? [...prev, saved]
          : prev.map((agent) => (agent.id === saved.id ? saved : agent))
      );
      setEditingId(null);
      onUpdated();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save agent");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Hume AI Agents</h2>
        <button className={styles.btnPrimary} style={{ width: "auto" }} type="button" onClick={() => startEdit()}>+ New Agent</button>
      </div>

      {loading ? <p className={styles.tdMuted}>Loading agents…</p> : null}
      {loadError ? <p style={{ color: "#f87171", fontSize: 12 }}>{loadError}</p> : null}

      {agents.map((a) => (
        <div key={a.id} className={styles.agentCard}>
          <div className={styles.agentCardHeader}>
            <div>
              <p className={styles.agentName}>{a.name}</p>
              <p className={styles.agentConfigId}>{a.configId}</p>
            </div>
            <button className={styles.btnGhost} style={{ fontSize: 12 }} type="button" onClick={() => startEdit(a)}>Edit</button>
          </div>
          {a.systemPrompt && <p className={styles.agentPrompt}>{a.systemPrompt}</p>}
        </div>
      ))}

      {editingId !== null && (
        <div className={styles.editForm}>
          <h3 className={styles.editFormTitle}>{editingId === "new" ? "New Agent" : "Edit Agent"}</h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Agent name</label>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Receptionist" />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Hume Config ID</label>
              <input className="input" value={form.configId} onChange={(e) => setForm((f) => ({ ...f, configId: e.target.value }))} placeholder="hume-prod-xxx" />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>System prompt</label>
            <textarea className="input" style={{ minHeight: 100 }} value={form.systemPrompt} onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))} placeholder="Describe the agent's behavior and role..." />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Greeting script</label>
            <textarea className="input" style={{ minHeight: 80 }} value={form.greetingScript} onChange={(e) => setForm((f) => ({ ...f, greetingScript: e.target.value }))} placeholder="What the AI says when the call connects..." />
          </div>
          {saveError ? <p style={{ color: "#f87171", fontSize: 12 }}>{saveError}</p> : null}
          <div className={styles.formActions}>
            <button className={styles.btnGhost} type="button" onClick={() => setEditingId(null)}>Cancel</button>
            <button className={styles.btnPrimary} style={{ width: "auto" }} type="button" onClick={() => void save()}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Numbers tab ─────────────────────────────────────────────────────────────

function NumbersTab({
  clientId,
  onUpdated,
}: {
  clientId: string;
  onUpdated: () => void;
}) {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<HumeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ twilioNumber: "", humeAgentId: "", isPrimary: false });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function loadData() {
    setLoading(true);
    setLoadError("");

    try {
      const [numbersData, agentsData] = await Promise.all([
        requestJson<PhoneNumber[]>(`/api/clients/${clientId}/phone-numbers`),
        requestJson<HumeAgent[]>(`/api/clients/${clientId}/hume-agents`),
      ]);
      setNumbers(numbersData);
      setAgents(agentsData);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load phone numbers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [clientId]);

  async function addNumber() {
    if (!form.twilioNumber.trim()) return;

    setSaving(true);
    setSaveError("");

    try {
      const created = await requestJson<PhoneNumber>(`/api/clients/${clientId}/phone-numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setNumbers((prev) => [...prev, created]);
      setForm({ twilioNumber: "", humeAgentId: "", isPrimary: false });
      onUpdated();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save phone number");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Assigned Phone Numbers</h2>
        <button className={styles.btnPrimary} style={{ width: "auto" }} type="button" onClick={() => setForm({ twilioNumber: "", humeAgentId: "", isPrimary: false })}>+ Add Number</button>
      </div>

      {loading ? <p className={styles.tdMuted}>Loading phone numbers…</p> : null}
      {loadError ? <p style={{ color: "#f87171", fontSize: 12 }}>{loadError}</p> : null}

      {numbers.map((n) => {
        const agent = agents.find((a) => a.id === n.agentId);
        return (
          <div key={n.id} className={styles.numberCard}>
            <div className={styles.numberCardLeft}>
              <p className={styles.numberCardNum}>{n.number}</p>
              <p className={styles.numberCardMeta}>
                {n.isPrimary && <span className="tag tag-blue" style={{ fontSize: 10, marginRight: 6 }}>PRIMARY</span>}
                Voice {n.voiceEnabled ? "enabled" : "disabled"} · SMS {n.smsEnabled ? "enabled" : "disabled"}
                {agent && ` · Agent: ${agent.name}`}
              </p>
            </div>
          </div>
        );
      })}

      <div className={styles.addForm}>
        <h3 className={styles.addFormTitle}>Add Number</h3>
        <div className={styles.formField}>
          <label className={styles.fieldLabel}>Twilio number (E.164)</label>
          <input className="input" placeholder="+27110000001" value={form.twilioNumber} onChange={(e) => setForm((f) => ({ ...f, twilioNumber: e.target.value }))} />
        </div>
        <div className={styles.formField}>
          <label className={styles.fieldLabel}>Assign to agent</label>
          <select className="input" value={form.humeAgentId} onChange={(e) => setForm((f) => ({ ...f, humeAgentId: e.target.value }))}>
            <option value="">No agent assigned</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))} />
          Set as primary number
        </label>
        {saveError ? <p style={{ color: "#f87171", fontSize: 12 }}>{saveError}</p> : null}
        <button
          className={styles.btnPrimary}
          style={{ width: "auto" }}
          type="button"
          onClick={() => void addNumber()}
          disabled={!form.twilioNumber || saving}
        >
          {saving ? "Saving..." : "Add Number"}
        </button>
      </div>
    </div>
  );
}

// ─── Contacts tab ─────────────────────────────────────────────────────────────

function ContactsTab({ clientId }: { clientId: string }) {
  const contacts = MOCK_CONTACTS;
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Contacts ({contacts.length})</h2>
      </div>
      <SimpleTable
        headers={["Name", "Phone", "Email", "Source", "Last Seen"]}
        rows={contacts.map((c) => [
          c.fullName,
          c.phoneE164,
          c.email,
          c.source,
          new Date(c.lastSeenAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
}

// ─── Leads tab ───────────────────────────────────────────────────────────────

function LeadsTab({ clientId }: { clientId: string }) {
  const leads = MOCK_LEADS;
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Leads ({leads.length})</h2>
      </div>
      <SimpleTable
        headers={["Name", "Phone", "Topic", "Callback", "Status", "Created"]}
        rows={leads.map((l) => [
          l.name,
          l.phone,
          l.topic,
          l.preferredCallbackTime || "—",
          l.status,
          new Date(l.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
        ])}
      />
    </div>
  );
}

// ─── Calls tab ───────────────────────────────────────────────────────────────

function CallsTab({ clientId }: { clientId: string }) {
  const calls = MOCK_CALLS;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Calls ({calls.length})</h2>
      </div>
      <div className={styles.callsList}>
        {calls.map((c) => (
          <CallRow
            key={c.id}
            call={c}
            expanded={expanded === c.id}
            onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CallRow({
  call: c,
  expanded,
  onToggle,
}: {
  call: typeof MOCK_CALLS[0];
  expanded: boolean;
  onToggle: () => void;
}) {
  const mins = Math.floor(c.durationSeconds / 60);
  const secs = c.durationSeconds % 60;
  const dirColor = c.direction === "outbound" ? "#4CAF50" : "#4A90D9";
  const DirIcon = () => c.direction === "outbound" ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dirColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dirColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>
  );

  return (
    <div className={styles.callRow}>
      <button className={styles.callRowToggle} onClick={onToggle}>
        <div className={styles.callDirIcon} style={{ background: `${dirColor}15` }}>
          <DirIcon />
        </div>
        <div className={styles.callMain}>
          <div className={styles.callTop}>
            <span className={styles.callName}>{c.contactName || "Unknown"}</span>
            {c.contactPhone && <span className={styles.callPhone}>{c.contactPhone}</span>}
          </div>
          <div className={styles.callMeta}>
            <span>{c.direction}</span>
            {c.durationSeconds > 0 && <span>{mins}m {secs}s</span>}
            <span>{new Date(c.startedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            <span>{c.outcome}</span>
          </div>
          {c.summary && !expanded && <p className={styles.callSummary}>{c.summary}</p>}
        </div>
        <div className={styles.callChevron}>
          {expanded ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          )}
        </div>
      </button>

      {expanded && (
        <div className={styles.callDetail}>
          {c.summary && (
            <div className={styles.callDetailSection}>
              <p className={styles.callDetailLabel}>AI SUMMARY</p>
              <p className={styles.callDetailText}>{c.summary}</p>
            </div>
          )}
          <div className={styles.callDetailSection}>
            <p className={styles.callDetailLabel}>TRANSCRIPT</p>
            {c.hasTranscript ? (
              <div className={styles.transcript}>
                {[
                  { speaker: "assistant", text: "Hi, you've reached Luna, how can I help you today?" },
                  { speaker: "caller", text: "Hi, I'd like to know more about your services please." },
                  { speaker: "assistant", text: "Of course! I'd be happy to help. What specifically are you interested in?" },
                ].map((t, i) => (
                  <div key={i} className={`${styles.transcriptLine} ${t.speaker === "assistant" ? styles.transcriptAssistant : ""}`}>
                    <div className={styles.transcriptBubble}>
                      <p className={styles.transcriptSpeaker}>{t.speaker === "assistant" ? "AI AGENT" : "CALLER"}</p>
                      <p>{t.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noTranscript}>No transcript available for this call.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tasks tab ───────────────────────────────────────────────────────────────

function TasksTab({ clientId }: { clientId: string }) {
  const tasks = [
    { id: "t1", taskType: "Follow-up call", status: "open", dueAt: "2026-03-22", notes: "Call Emily Thompson to confirm demo time" },
    { id: "t2", taskType: "Send proposal", status: "done", dueAt: "2026-03-20", notes: "Send pricing document to Daniel Martin" },
  ];
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Tasks ({tasks.length})</h2>
      </div>
      <SimpleTable
        headers={["Type", "Status", "Due", "Notes"]}
        rows={tasks.map((t) => [t.taskType, t.status, t.dueAt, t.notes])}
      />
    </div>
  );
}

// ─── Usage & billing ──────────────────────────────────────────────────────────

function UsageSection({ clients }: { clients: Client[] }) {
  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Usage & Billing</h1>
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Client Usage</h2>
          <button className={styles.btnGhost}>Export CSV</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client</th><th>Plan</th><th>Calls today</th><th>Total calls</th>
              <th>Leads today</th><th>AI agents</th><th>Phone numbers</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td className={styles.tdName}>{c.name}</td>
                <td><span className={`tag ${c.plan === "pro" ? "tag-blue" : "tag-amber"}`}>{c.plan}</span></td>
                <td>{c.callsToday}</td><td>{c.totalCalls}</td><td>{c.newLeadsToday}</td>
                <td>{c.HumeAgentCount}</td><td>{c.phoneNumberCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Global integrations ──────────────────────────────────────────────────────

function IntegrationsSection() {
  const integrations = [
    { name: "Trello", desc: "Auto-create cards for new leads", icon: "📋", connected: false },
    { name: "Slack", desc: "Notify team of missed calls", icon: "💬", connected: false },
    { name: "Google Calendar", desc: "Sync availability with EVI", icon: "📅", connected: false },
    { name: "Zapier", desc: "Connect to 5,000+ apps", icon: "⚡", connected: false },
  ];
  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Global Integrations</h1>
      <p className={styles.sectionDesc}>Connect tools that apply across all clients.</p>
      <div className={styles.intGrid}>
        {integrations.map((item) => (
          <div key={item.name} className={styles.intCard}>
            <div className={styles.intIcon}>{item.icon}</div>
            <div className={styles.intInfo}>
              <p className={styles.intName}>{item.name}</p>
              <p className={styles.intDesc}>{item.desc}</p>
            </div>
            <button className={styles.btnAccent} style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}>
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

function SettingsSection() {
  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Settings</h1>
      <div className={styles.settingsGrid}>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Admin Account</h3>
          <InfoRow label="Name" value="Admin" />
          <InfoRow label="Email" value="admin@luna.ai" />
          <button className={styles.btnGhost} style={{ marginTop: 16 }}>Edit profile</button>
        </div>
        <div className={styles.infoCard}>
          <AdminPasswordChange />
        </div>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Global Defaults</h3>
          <InfoRow label="Default plan" value="starter" />
          <InfoRow label="Trial period" value="14 days" />
          <button className={styles.btnGhost} style={{ marginTop: 16 }}>Edit defaults</button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin password change ─────────────────────────────────────────────────────

function AdminPasswordChange() {
  const [current, setCurrent] = useState("");
  const [fresh, setFresh] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, fresh: false, confirm: false });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (fresh.length < 6) { setError("New password must be at least 6 characters"); return; }
    if (fresh !== confirm) { setError("New passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: fresh }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to change password"); return; }
      setSuccess(true);
      setCurrent(""); setFresh(""); setConfirm("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h3 className={styles.infoCardTitle}>Change Password</h3>
      <form onSubmit={handleSubmit} className={styles.passwordForm}>
        <div className={styles.passwordField}>
          <input
            type={showPass.current ? "text" : "password"}
            className="input"
            style={{ paddingRight: 40 }}
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <button type="button" className={styles.passwordToggle} onClick={() => setShowPass((p) => ({ ...p, current: !p.current }))}>
            {showPass.current ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        <div className={styles.passwordField}>
          <input
            type={showPass.fresh ? "text" : "password"}
            className="input"
            style={{ paddingRight: 40 }}
            placeholder="New password (min 6 chars)"
            value={fresh}
            onChange={(e) => setFresh(e.target.value)}
            required
          />
          <button type="button" className={styles.passwordToggle} onClick={() => setShowPass((p) => ({ ...p, fresh: !p.fresh }))}>
            {showPass.fresh ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        <div className={styles.passwordField}>
          <input
            type={showPass.confirm ? "text" : "password"}
            className="input"
            style={{ paddingRight: 40 }}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button type="button" className={styles.passwordToggle} onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}>
            {showPass.confirm ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        {error && <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
        {success && <p style={{ color: "#4ade80", fontSize: 12 }}>Password updated successfully!</p>}
        <button type="submit" className={styles.btnPrimary} style={{ width: "auto", marginTop: 4 }} disabled={loading}>
          {loading ? "Saving…" : "Change Password"}
        </button>
      </form>
    </>
  );
}

// ─── New client modal ─────────────────────────────────────────────────────────

function NewClientModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Client) => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("SaaS");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro">("starter");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name || !contactEmail) return;

    setSubmitting(true);
    setError("");

    try {
      const created = await requestJson<Client>("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: contactEmail,
          phone: contactPhone,
          industry,
          plan,
          contactName,
        }),
      });
      onCreate({
        ...created,
        contactName: contactName || created.contactName,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New Client</h2>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          {[
            { label: "Company name", value: name, set: setName, placeholder: "Acme Corp" },
            { label: "Industry", value: industry, set: setIndustry, placeholder: "SaaS" },
            { label: "Contact name", value: contactName, set: setContactName, placeholder: "Jane Smith" },
            { label: "Contact email", value: contactEmail, set: setContactEmail, placeholder: "jane@acme.co.za", type: "email" },
            { label: "Contact phone", value: contactPhone, set: setContactPhone, placeholder: "+27 82 555 0182", type: "tel" },
          ].map((f) => (
            <div key={f.label} className={styles.formField}>
              <label className={styles.fieldLabel}>{f.label}</label>
              <input className="input" type={f.type ?? "text"} placeholder={f.placeholder} value={f.value} onChange={(e) => f.set(e.target.value)} />
            </div>
          ))}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Plan</label>
            <div className={styles.planPicker}>
              {(["starter", "pro"] as const).map((p) => (
                <button key={p} type="button" className={`${styles.planOption} ${plan === p ? styles.planSelected : ""}`} onClick={() => setPlan(p)}>
                  <span className={styles.planName}>{p}</span>
                  <span className={styles.planPrice}>{p === "starter" ? "R299/mo" : "R799/mo"}</span>
                </button>
              ))}
            </div>
          </div>
          {error ? <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p> : null}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} type="button" onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} style={{ width: "auto" }} type="button" onClick={() => void handleCreate()} disabled={submitting}>
            {submitting ? "Creating..." : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable components ─────────────────────────────────────────────────────

function StatCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statDelta}>{delta}</p>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.statBadge}>
      <p className={styles.statBadgeVal}>{value}</p>
      <p className={styles.statBadgeLbl}>{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) return <p className={styles.emptyState}>No records found.</p>;
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableOverflow}>
        <table className={styles.table}>
          <thead>
            <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} className={styles.tdMuted}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mock filtered agents helper
const HUME_AGENTS = MOCK_AGENTS;
