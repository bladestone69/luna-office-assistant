"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import styles from "./page.module.css";
import type {
  AdminCall,
  AdminClientDetail,
  AdminContact,
  AdminLead,
  AdminTask,
  Client,
  ClientUser,
  HumeAgent,
  PhoneNumber,
} from "./types";

type AdminSection =
  | "dashboard"
  | "clients"
  | "usage"
  | "integrations"
  | "settings";

type AdminMessage = {
  type: "success" | "error";
  text: string;
};

type ProfileSettings = {
  name: string;
  email: string;
};

type DefaultSettings = {
  defaultPlan: "starter" | "pro";
  trialPeriod: string;
};

type IntegrationState = Record<string, boolean>;

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

const STORAGE_KEYS = {
  integrations: "luna_admin_integrations",
  profile: "luna_admin_profile",
  defaults: "luna_admin_defaults",
};

const DEFAULT_PROFILE: ProfileSettings = {
  name: "Admin",
  email: "admin@luna.ai",
};

const DEFAULT_APP_SETTINGS: DefaultSettings = {
  defaultPlan: "starter",
  trialPeriod: "14 days",
};

const INTEGRATIONS = [
  { name: "Trello", desc: "Auto-create cards for new leads", icon: "TR" },
  { name: "Slack", desc: "Notify team of missed calls", icon: "SL" },
  { name: "Google Calendar", desc: "Sync availability with EVI", icon: "GC" },
  { name: "Zapier", desc: "Connect to 5,000+ apps", icon: "ZA" },
];

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  });
  const data = await readJson<{ error?: string } & T>(response);
  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data as T;
}

function formatDate(value: string) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CL";
}

function loadStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function downloadUsageCsv(clients: Client[]) {
  const headers = [
    "Client",
    "Plan",
    "Status",
    "Calls Today",
    "Total Calls",
    "Leads Today",
    "AI Agents",
    "Phone Numbers",
    "Contact Email",
    "Contact Phone",
  ];

  const rows = clients.map((client) => [
    client.name,
    client.plan,
    client.status,
    String(client.callsToday),
    String(client.totalCalls),
    String(client.newLeadsToday),
    String(client.HumeAgentCount),
    String(client.phoneNumberCount),
    client.contactEmail,
    client.contactPhone ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `luna-client-usage-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [section, setSection] = useState<AdminSection>("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<(typeof CLIENT_TABS)[number]>("Overview");
  const [showNewClient, setShowNewClient] = useState(false);
  const [detailsByClientId, setDetailsByClientId] = useState<Record<string, AdminClientDetail>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState("");

  async function loadClients() {
    setLoadingClients(true);
    setClientsError("");
    try {
      const nextClients = await apiRequest<Client[]>("/api/clients");
      setClients(nextClients);
    } catch (error) {
      setClientsError(error instanceof Error ? error.message : "Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadClientDetail(clientId: string) {
    setLoadingDetailId(clientId);
    setDetailError("");
    try {
      const detail = await apiRequest<AdminClientDetail>(`/api/clients/${clientId}`);
      setDetailsByClientId((current) => ({ ...current, [clientId]: detail }));
      setClients((current) => current.map((client) => (client.id === clientId ? detail.client : client)));
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to load client details");
    } finally {
      setLoadingDetailId((current) => (current === clientId ? null : current));
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      return;
    }
    void loadClientDetail(selectedClientId);
  }, [selectedClientId]);

  const selectedDetail = selectedClientId ? detailsByClientId[selectedClientId] ?? null : null;
  const selectedClient =
    selectedDetail?.client ??
    clients.find((client) => client.id === selectedClientId) ??
    null;

  return (
    <div className={styles.layout}>
      <AdminSidebar
        sections={SECTIONS}
        active={section}
        onSelect={(id) => {
          setSection(id as AdminSection);
          setSelectedClientId(null);
          setDetailError("");
        }}
      />

      <main className={styles.main}>
        <TopBar />

        <div className={styles.content}>
          {section === "dashboard" && (
            <DashboardSection
              clients={clients}
              loading={loadingClients}
              error={clientsError}
              onViewClient={(id) => {
                setSelectedClientId(id);
                setSection("clients");
              }}
            />
          )}

          {section === "clients" && !selectedClient && (
            <ClientsSection
              clients={clients}
              loading={loadingClients}
              error={clientsError}
              onRetry={() => void loadClients()}
              onSelect={(client) => {
                setSelectedClientId(client.id);
                setClientTab("Overview");
              }}
              onNew={() => setShowNewClient(true)}
            />
          )}

          {section === "clients" && selectedClient && (
            <ClientDetailSection
              client={selectedClient}
              detail={selectedDetail}
              detailLoading={loadingDetailId === selectedClient.id}
              detailError={detailError}
              onRefresh={() => void loadClientDetail(selectedClient.id)}
              onRefreshClients={() => void loadClients()}
              onBack={() => setSelectedClientId(null)}
              activeTab={clientTab}
              onTabChange={setClientTab}
            />
          )}

          {section === "usage" && (
            <UsageSection clients={clients} loading={loadingClients} onExport={() => downloadUsageCsv(clients)} />
          )}
          {section === "integrations" && <IntegrationsSection />}
          {section === "settings" && <SettingsSection />}
        </div>
      </main>

      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onCreate={async (payload) => {
            const created = await apiRequest<Client>("/api/clients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            setClients((current) => [created, ...current]);
            setShowNewClient(false);
          }}
        />
      )}
    </div>
  );
}

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

function DashboardSection({
  clients,
  loading,
  error,
  onViewClient,
}: {
  clients: Client[];
  loading: boolean;
  error: string;
  onViewClient: (id: string) => void;
}) {
  const totalCalls = clients.reduce((sum, client) => sum + client.totalCalls, 0);
  const totalToday = clients.reduce((sum, client) => sum + client.callsToday, 0);
  const totalLeads = clients.reduce((sum, client) => sum + client.newLeadsToday, 0);
  const activeClients = clients.filter((client) => client.status === "active").length;

  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <div className={styles.statsGrid}>
        <StatCard label="Active Clients" value={String(activeClients)} delta={`of ${clients.length} total`} />
        <StatCard label="Calls Today" value={String(totalToday)} delta={`${totalCalls.toLocaleString()} total`} />
        <StatCard label="New Leads Today" value={String(totalLeads)} delta="Across all clients" />
        <StatCard label="Revenue (MRR)" value="R4,200" delta="Estimated recurring revenue" />
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Clients</h2>
        </div>
        {loading ? (
          <p className={styles.emptyState}>Loading clients...</p>
        ) : error ? (
          <p className={styles.emptyState}>{error}</p>
        ) : !clients.length ? (
          <p className={styles.emptyState}>No clients yet.</p>
        ) : (
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
              {clients.map((client) => (
                <tr key={client.id} className="cursor-pointer" onClick={() => onViewClient(client.id)}>
                  <td>
                    <div className={styles.clientCell}>
                      <div className={styles.clientAvatar}>{getInitials(client.name)}</div>
                      <div>
                        <p className={styles.tdName}>{client.name}</p>
                        <p className={styles.tdMuted}>{client.industry}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${client.plan === "pro" ? "tag-blue" : "tag-amber"}`}>{client.plan}</span>
                  </td>
                  <td>{client.HumeAgentCount}</td>
                  <td>{client.phoneNumberCount}</td>
                  <td>
                    {client.callsToday} <span className={styles.tdMuted}>/ {client.totalCalls}</span>
                  </td>
                  <td>{client.newLeadsToday}</td>
                  <td>
                    <span className={`tag ${client.status === "active" ? "tag-green" : "tag-amber"}`}>{client.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ClientsSection({
  clients,
  loading,
  error,
  onRetry,
  onSelect,
  onNew,
}: {
  clients: Client[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelect: (client: Client) => void;
  onNew: () => void;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeaderRow}>
        <h1 className={styles.pageTitle}>Clients</h1>
        <button className={styles.btnPrimary} onClick={onNew} type="button">
          + New Client
        </button>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading clients...</p>
      ) : error ? (
        <div className={styles.infoCard}>
          <p className={styles.emptyState}>{error}</p>
          <button className={styles.btnGhost} type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : !clients.length ? (
        <p className={styles.emptyState}>No clients created yet.</p>
      ) : (
        <div className={styles.clientCards}>
          {clients.map((client) => (
            <div key={client.id} className={styles.clientCard} onClick={() => onSelect(client)}>
              <div className={styles.clientCardHeader}>
                <div className={styles.clientAvatarLarge}>{getInitials(client.name)}</div>
                <div className={styles.clientCardMeta}>
                  <h3 className={styles.clientCardName}>{client.name}</h3>
                  <p className={styles.clientCardIndustry}>
                    {client.industry} · {client.contactEmail}
                  </p>
                </div>
                <span className={`tag ${client.plan === "pro" ? "tag-blue" : "tag-amber"}`}>{client.plan}</span>
              </div>

              <div className={styles.clientCardStats}>
                {[
                  { val: client.HumeAgentCount, lbl: "Agents" },
                  { val: client.phoneNumberCount, lbl: "Numbers" },
                  { val: client.callsToday, lbl: "Calls today" },
                  { val: client.totalCalls, lbl: "Total calls" },
                ].map((stat) => (
                  <div key={stat.lbl} className={styles.clientCardStat}>
                    <span className={styles.clientCardStatVal}>{stat.val}</span>
                    <span className={styles.clientCardStatLbl}>{stat.lbl}</span>
                  </div>
                ))}
              </div>

              <div className={styles.clientCardFooter}>
                <span className={`tag ${client.status === "active" ? "tag-green" : "tag-amber"}`}>{client.status}</span>
                <span className={styles.tdMuted}>Since {client.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientDetailSection({
  client,
  detail,
  detailLoading,
  detailError,
  onRefresh,
  onRefreshClients,
  onBack,
  activeTab,
  onTabChange,
}: {
  client: Client;
  detail: AdminClientDetail | null;
  detailLoading: boolean;
  detailError: string;
  onRefresh: () => void;
  onRefreshClients: () => void;
  onBack: () => void;
  activeTab: (typeof CLIENT_TABS)[number];
  onTabChange: (tab: (typeof CLIENT_TABS)[number]) => void;
}) {
  return (
    <div className={styles.section}>
      <button className={styles.backBtn} onClick={onBack} type="button">
        ← All Clients
      </button>

      <div className={styles.clientDetailHeader}>
        <div className={styles.clientAvatarLarge}>{getInitials(client.name)}</div>
        <div>
          <h1 className={styles.clientDetailName}>{client.name}</h1>
          <p className={styles.clientDetailMeta}>
            {client.industry} · {client.contactEmail}
          </p>
        </div>
        <div className={styles.clientDetailStats}>
          <StatBadge label="Calls Today" value={client.callsToday} />
          <StatBadge label="Total Calls" value={client.totalCalls} />
          <StatBadge label="New Leads" value={client.newLeadsToday} />
        </div>
      </div>

      <div className={styles.detailTabs}>
        {CLIENT_TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.detailTab} ${activeTab === tab ? styles.detailTabActive : ""}`}
            onClick={() => onTabChange(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {detailLoading && !detail && <p className={styles.emptyState}>Loading client details...</p>}
      {detailError && !detail && (
        <div className={styles.infoCard}>
          <p className={styles.emptyState}>{detailError}</p>
          <button className={styles.btnGhost} type="button" onClick={onRefresh}>
            Retry
          </button>
        </div>
      )}

      {detail && activeTab === "Overview" && (
        <OverviewTab client={detail.client}>
          <ClientAccessPanel
            clientId={detail.client.id}
            users={detail.clientUsers}
            onChanged={() => {
              onRefresh();
              onRefreshClients();
            }}
          />
        </OverviewTab>
      )}

      {detail && activeTab === "Hume Agent" && (
        <HumeAgentTab
          clientId={detail.client.id}
          agents={detail.humeAgents}
          onChanged={() => {
            onRefresh();
            onRefreshClients();
          }}
        />
      )}

      {detail && activeTab === "Numbers" && (
        <NumbersTab
          clientId={detail.client.id}
          numbers={detail.phoneNumbers}
          agents={detail.humeAgents}
          onChanged={() => {
            onRefresh();
            onRefreshClients();
          }}
        />
      )}

      {detail && activeTab === "Contacts" && <ContactsTab contacts={detail.contacts} />}
      {detail && activeTab === "Leads" && <LeadsTab leads={detail.leads} />}
      {detail && activeTab === "Calls" && <CallsTab calls={detail.calls} />}
      {detail && activeTab === "Tasks" && <TasksTab tasks={detail.tasks} />}
    </div>
  );
}

function OverviewTab({
  client,
  children,
}: {
  client: Client;
  children: React.ReactNode;
}) {
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
        {children}
      </div>
    </div>
  );
}

function ClientAccessPanel({
  clientId,
  users,
  onChanged,
}: {
  clientId: string;
  users: ClientUser[];
  onChanged: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("client123");
  const [newName, setNewName] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);

  const loginUrl =
    typeof window === "undefined" ? "/login" : `${window.location.origin}/login`;

  function clearMessage() {
    setMessage(null);
  }

  async function handleCreateUser() {
    clearMessage();
    setSubmitting(true);
    try {
      await apiRequest(`/api/clients/${clientId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
        }),
      });
      setMessage({ type: "success", text: "Client login created." });
      setNewEmail("");
      setNewPassword("client123");
      setNewName("");
      setAddingUser(false);
      onChanged();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to create login" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSavePassword() {
    if (!resetUserId) {
      return;
    }

    clearMessage();
    setSubmitting(true);
    try {
      await apiRequest(`/api/clients/${clientId}/users/${resetUserId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordValue }),
      });
      setMessage({ type: "success", text: "Password reset saved." });
      setResetUserId(null);
      setPasswordValue("");
      onChanged();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to reset password" });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(loginUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.accessPanel}>
      <div className={styles.accessPanelHeader}>
        <div className={styles.accessPanelTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          <h3>Client Portal Access</h3>
        </div>
      </div>

      <div className={styles.loginUrlBox}>
        <p className={styles.loginUrlLabel}>Login URL</p>
        <div className={styles.loginUrlRow}>
          <code className={styles.loginUrlCode}>{loginUrl}</code>
          <button className={styles.iconBtn} onClick={() => void copyUrl()} title="Copy URL" type="button">
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
          <button
            className={styles.iconBtn}
            title="Open"
            type="button"
            onClick={() => window.open(loginUrl, "_blank", "noopener,noreferrer")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.usersSection}>
        <p className={styles.usersSectionLabel}>Team logins</p>

        {users.length === 0 && <p className={styles.emptyState}>No client logins created yet.</p>}

        {users.map((user) => (
          <div key={user.id} className={styles.userRow}>
            <div className={styles.smallAvatar}>{getInitials(user.name)}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user.email}</p>
              <p className={styles.userRole}>{user.role}</p>
            </div>
            <div className={styles.userActions}>
              <button
                className={styles.btnSm}
                onClick={() => {
                  clearMessage();
                  setResetUserId(user.id);
                  setPasswordValue("");
                }}
                type="button"
              >
                Reset password
              </button>
            </div>
          </div>
        ))}

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
                onChange={(event) => setPasswordValue(event.target.value)}
              />
              <button className={styles.passwordToggle} onClick={() => setShowPassword((current) => !current)} type="button">
                {showPassword ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div className={styles.inlineFormActions}>
              <button className={styles.btnGhostSm} onClick={() => setResetUserId(null)} type="button">
                Cancel
              </button>
              <button
                className={styles.btnSm}
                disabled={passwordValue.length < 6 || submitting}
                onClick={() => void handleSavePassword()}
                type="button"
              >
                {submitting ? "Saving..." : "Save Password"}
              </button>
            </div>
          </div>
        )}

        {addingUser ? (
          <div className={styles.inlineForm}>
            <p className={styles.inlineFormTitle}>Create login</p>
            <input className="input" type="text" placeholder="Display name (optional)" value={newName} onChange={(event) => setNewName(event.target.value)} />
            <input className="input" type="email" placeholder="Email address" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
            <input className="input" type="text" placeholder="Password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <div className={styles.inlineFormActions}>
              <button className={styles.btnGhostSm} onClick={() => setAddingUser(false)} type="button">
                Cancel
              </button>
              <button
                className={styles.btnSm}
                disabled={!newEmail || newPassword.length < 6 || submitting}
                onClick={() => void handleCreateUser()}
                type="button"
              >
                {submitting ? "Saving..." : "Create Login"}
              </button>
            </div>
          </div>
        ) : (
          <button className={styles.btnAddUser} onClick={() => setAddingUser(true)} type="button">
            + Add another login
          </button>
        )}

        {message && (
          <p style={{ color: message.type === "error" ? "#f87171" : "#4ade80", fontSize: 12, marginTop: 8 }}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

function HumeAgentTab({
  clientId,
  agents,
  onChanged,
}: {
  clientId: string;
  agents: HumeAgent[];
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", configId: "", systemPrompt: "", greetingScript: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);

  function startEdit(agent?: HumeAgent) {
    setMessage(null);
    if (agent) {
      setEditingId(agent.id);
      setForm({
        name: agent.name,
        configId: agent.configId,
        systemPrompt: agent.systemPrompt ?? "",
        greetingScript: agent.greetingScript ?? "",
      });
      return;
    }

    setEditingId("new");
    setForm({ name: "", configId: "", systemPrompt: "", greetingScript: "" });
  }

  async function save() {
    setMessage(null);
    setSaving(true);
    try {
      if (editingId === "new") {
        await apiRequest(`/api/clients/${clientId}/hume-agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else if (editingId) {
        await apiRequest(`/api/clients/${clientId}/hume-agents/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      setMessage({ type: "success", text: "Agent saved." });
      setEditingId(null);
      onChanged();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save agent" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Hume AI Agents</h2>
        <button className={styles.btnPrimary} style={{ width: "auto" }} onClick={() => startEdit()} type="button">
          + New Agent
        </button>
      </div>

      {!agents.length && <p className={styles.emptyState}>No Hume agents saved for this client yet.</p>}

      {agents.map((agent) => (
        <div key={agent.id} className={styles.agentCard}>
          <div className={styles.agentCardHeader}>
            <div>
              <p className={styles.agentName}>{agent.name}</p>
              <p className={styles.agentConfigId}>{agent.configId}</p>
            </div>
            <button className={styles.btnGhost} style={{ fontSize: 12 }} onClick={() => startEdit(agent)} type="button">
              Edit
            </button>
          </div>
          {agent.systemPrompt && <p className={styles.agentPrompt}>{agent.systemPrompt}</p>}
        </div>
      ))}

      {editingId !== null && (
        <div className={styles.editForm}>
          <h3 className={styles.editFormTitle}>{editingId === "new" ? "New Agent" : "Edit Agent"}</h3>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Agent name</label>
              <input className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Receptionist" />
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Hume Config ID</label>
              <input className="input" value={form.configId} onChange={(event) => setForm((current) => ({ ...current, configId: event.target.value }))} placeholder="hume-prod-xxx" />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>System prompt</label>
            <textarea className="input" style={{ minHeight: 100 }} value={form.systemPrompt} onChange={(event) => setForm((current) => ({ ...current, systemPrompt: event.target.value }))} placeholder="Describe the agent behavior..." />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Greeting script</label>
            <textarea className="input" style={{ minHeight: 80 }} value={form.greetingScript} onChange={(event) => setForm((current) => ({ ...current, greetingScript: event.target.value }))} placeholder="What the AI says when the call connects..." />
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnGhost} onClick={() => setEditingId(null)} type="button">
              Cancel
            </button>
            <button className={styles.btnPrimary} style={{ width: "auto" }} onClick={() => void save()} disabled={!form.name || !form.configId || saving} type="button">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p style={{ color: message.type === "error" ? "#f87171" : "#4ade80", fontSize: 12 }}>
          {message.text}
        </p>
      )}
    </div>
  );
}

function NumbersTab({
  clientId,
  numbers,
  agents,
  onChanged,
}: {
  clientId: string;
  numbers: PhoneNumber[];
  agents: HumeAgent[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ twilioNumber: "", humeAgentId: "", isPrimary: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);

  async function addNumber() {
    setMessage(null);
    setSaving(true);
    try {
      await apiRequest(`/api/clients/${clientId}/phone-numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: form.twilioNumber,
          humeAgentId: form.humeAgentId,
          isPrimary: form.isPrimary,
        }),
      });
      setMessage({ type: "success", text: "Phone number saved." });
      setForm({ twilioNumber: "", humeAgentId: "", isPrimary: false });
      setShowForm(false);
      onChanged();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save phone number" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Assigned Phone Numbers</h2>
        <button
          className={styles.btnPrimary}
          style={{ width: "auto" }}
          onClick={() => {
            setMessage(null);
            setForm({ twilioNumber: "", humeAgentId: "", isPrimary: false });
            setShowForm(true);
          }}
          type="button"
        >
          + Add Number
        </button>
      </div>

      {!numbers.length && <p className={styles.emptyState}>No phone numbers assigned yet.</p>}

      {numbers.map((numberItem) => {
        const agent = agents.find((agentItem) => agentItem.id === numberItem.agentId);
        return (
          <div key={numberItem.id} className={styles.numberCard}>
            <div className={styles.numberCardLeft}>
              <p className={styles.numberCardNum}>{numberItem.number}</p>
              <p className={styles.numberCardMeta}>
                {numberItem.isPrimary && (
                  <span className="tag tag-blue" style={{ fontSize: 10, marginRight: 6 }}>
                    PRIMARY
                  </span>
                )}
                Voice {numberItem.voiceEnabled ? "enabled" : "disabled"} · SMS {numberItem.smsEnabled ? "enabled" : "disabled"}
                {agent ? ` · Agent: ${agent.name}` : ""}
              </p>
            </div>
          </div>
        );
      })}

      {showForm && (
        <div className={styles.addForm}>
          <h3 className={styles.addFormTitle}>Add Number</h3>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Twilio number (E.164)</label>
            <input className="input" placeholder="+27110000001" value={form.twilioNumber} onChange={(event) => setForm((current) => ({ ...current, twilioNumber: event.target.value }))} />
          </div>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Assign to agent</label>
            <select className="input" value={form.humeAgentId} onChange={(event) => setForm((current) => ({ ...current, humeAgentId: event.target.value }))}>
              <option value="">No agent assigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={form.isPrimary} onChange={(event) => setForm((current) => ({ ...current, isPrimary: event.target.checked }))} />
            Set as primary number
          </label>
          <div className={styles.inlineFormActions}>
            <button className={styles.btnGhostSm} onClick={() => setShowForm(false)} type="button">
              Cancel
            </button>
            <button className={styles.btnPrimary} style={{ width: "auto" }} onClick={() => void addNumber()} disabled={!form.twilioNumber || saving} type="button">
              {saving ? "Saving..." : "Add Number"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p style={{ color: message.type === "error" ? "#f87171" : "#4ade80", fontSize: 12 }}>
          {message.text}
        </p>
      )}
    </div>
  );
}

function ContactsTab({ contacts }: { contacts: AdminContact[] }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Contacts ({contacts.length})</h2>
      </div>
      <SimpleTable
        headers={["Name", "Phone", "Email", "Source", "Last Seen"]}
        rows={contacts.map((contact) => [
          contact.fullName,
          contact.phoneE164,
          contact.email || "-",
          contact.source,
          formatDate(contact.lastSeenAt),
        ])}
      />
    </div>
  );
}

function LeadsTab({ leads }: { leads: AdminLead[] }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Leads ({leads.length})</h2>
      </div>
      <SimpleTable
        headers={["Name", "Phone", "Topic", "Callback", "Status", "Created"]}
        rows={leads.map((lead) => [
          lead.name,
          lead.phone,
          lead.topic,
          lead.preferredCallbackTime || "-",
          lead.status,
          formatDate(lead.createdAt),
        ])}
      />
    </div>
  );
}

function CallsTab({ calls }: { calls: AdminCall[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Calls ({calls.length})</h2>
      </div>

      {!calls.length ? (
        <p className={styles.emptyState}>No calls recorded yet.</p>
      ) : (
        <div className={styles.callsList}>
          {calls.map((call) => (
            <CallRow
              key={call.id}
              call={call}
              expanded={expandedId === call.id}
              onToggle={() => setExpandedId((current) => (current === call.id ? null : call.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CallRow({
  call,
  expanded,
  onToggle,
}: {
  call: AdminCall;
  expanded: boolean;
  onToggle: () => void;
}) {
  const minutes = Math.floor(call.durationSeconds / 60);
  const seconds = call.durationSeconds % 60;
  const directionColor = call.direction === "outbound" ? "#4CAF50" : "#4A90D9";

  return (
    <div className={styles.callRow}>
      <button className={styles.callRowToggle} onClick={onToggle} type="button">
        <div className={styles.callDirIcon} style={{ background: `${directionColor}15` }}>
          {call.direction === "outbound" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={directionColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={directionColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="7" x2="7" y2="17" />
              <polyline points="17 17 7 17 7 7" />
            </svg>
          )}
        </div>
        <div className={styles.callMain}>
          <div className={styles.callTop}>
            <span className={styles.callName}>{call.contactName || "Unknown"}</span>
            {call.contactPhone && <span className={styles.callPhone}>{call.contactPhone}</span>}
          </div>
          <div className={styles.callMeta}>
            <span>{call.direction}</span>
            {call.durationSeconds > 0 && (
              <span>
                {minutes}m {seconds}s
              </span>
            )}
            <span>{formatDateTime(call.startedAt)}</span>
            <span>{call.outcome}</span>
          </div>
          {call.summary && !expanded && <p className={styles.callSummary}>{call.summary}</p>}
        </div>
        <div className={styles.callChevron}>
          {expanded ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </button>

      {expanded && (
        <div className={styles.callDetail}>
          {call.summary && (
            <div className={styles.callDetailSection}>
              <p className={styles.callDetailLabel}>AI SUMMARY</p>
              <p className={styles.callDetailText}>{call.summary}</p>
            </div>
          )}
          <div className={styles.callDetailSection}>
            <p className={styles.callDetailLabel}>TRANSCRIPT</p>
            {call.hasTranscript ? (
              <div className={styles.transcript}>
                {call.transcriptLines.map((line, index) => (
                  <div
                    key={`${call.id}-${index}`}
                    className={`${styles.transcriptLine} ${line.speaker === "assistant" ? styles.transcriptAssistant : ""}`}
                  >
                    <div className={styles.transcriptBubble}>
                      <p className={styles.transcriptSpeaker}>{line.speaker.toUpperCase()}</p>
                      <p>{line.text}</p>
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

function TasksTab({ tasks }: { tasks: AdminTask[] }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Tasks ({tasks.length})</h2>
      </div>
      <SimpleTable
        headers={["Type", "Status", "Due", "Notes"]}
        rows={tasks.map((task) => [task.taskType, task.status, task.dueAt || "-", task.notes || "-"])}
      />
    </div>
  );
}

function UsageSection({
  clients,
  loading,
  onExport,
}: {
  clients: Client[];
  loading: boolean;
  onExport: () => void;
}) {
  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Usage & Billing</h1>
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Client Usage</h2>
          <button className={styles.btnGhost} type="button" onClick={onExport} disabled={!clients.length}>
            Export CSV
          </button>
        </div>
        {loading ? (
          <p className={styles.emptyState}>Loading usage data...</p>
        ) : !clients.length ? (
          <p className={styles.emptyState}>No usage data available.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Plan</th>
                <th>Calls today</th>
                <th>Total calls</th>
                <th>Leads today</th>
                <th>AI agents</th>
                <th>Phone numbers</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className={styles.tdName}>{client.name}</td>
                  <td>
                    <span className={`tag ${client.plan === "pro" ? "tag-blue" : "tag-amber"}`}>{client.plan}</span>
                  </td>
                  <td>{client.callsToday}</td>
                  <td>{client.totalCalls}</td>
                  <td>{client.newLeadsToday}</td>
                  <td>{client.HumeAgentCount}</td>
                  <td>{client.phoneNumberCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function IntegrationsSection() {
  const [connections, setConnections] = useState<IntegrationState>({});

  useEffect(() => {
    setConnections(loadStoredValue<IntegrationState>(STORAGE_KEYS.integrations, {}));
  }, []);

  function toggleIntegration(name: string) {
    setConnections((current) => {
      const next = { ...current, [name]: !current[name] };
      saveStoredValue(STORAGE_KEYS.integrations, next);
      return next;
    });
  }

  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Global Integrations</h1>
      <p className={styles.sectionDesc}>Connect tools that apply across all clients.</p>
      <div className={styles.intGrid}>
        {INTEGRATIONS.map((item) => {
          const connected = connections[item.name] === true;
          return (
            <div key={item.name} className={styles.intCard}>
              <div className={styles.intIcon}>{item.icon}</div>
              <div className={styles.intInfo}>
                <p className={styles.intName}>{item.name}</p>
                <p className={styles.intDesc}>{item.desc}</p>
              </div>
              <button
                className={styles.btnAccent}
                style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap" }}
                onClick={() => toggleIntegration(item.name)}
                type="button"
              >
                {connected ? "Connected" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsSection() {
  const [profile, setProfile] = useState<ProfileSettings>(DEFAULT_PROFILE);
  const [defaults, setDefaults] = useState<DefaultSettings>(DEFAULT_APP_SETTINGS);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingDefaults, setEditingDefaults] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);

  useEffect(() => {
    setProfile(loadStoredValue(STORAGE_KEYS.profile, DEFAULT_PROFILE));
    setDefaults(loadStoredValue(STORAGE_KEYS.defaults, DEFAULT_APP_SETTINGS));
  }, []);

  function saveProfile() {
    saveStoredValue(STORAGE_KEYS.profile, profile);
    setEditingProfile(false);
    setMessage({ type: "success", text: "Profile settings saved." });
  }

  function saveDefaults() {
    saveStoredValue(STORAGE_KEYS.defaults, defaults);
    setEditingDefaults(false);
    setMessage({ type: "success", text: "Global defaults saved." });
  }

  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Settings</h1>
      <div className={styles.settingsGrid}>
        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Admin Account</h3>
          {editingProfile ? (
            <>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Name</label>
                <input className="input" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Email</label>
                <input className="input" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className={styles.inlineFormActions}>
                <button className={styles.btnGhostSm} onClick={() => setEditingProfile(false)} type="button">
                  Cancel
                </button>
                <button className={styles.btnGhost} style={{ marginTop: 16 }} onClick={saveProfile} type="button">
                  Save profile
                </button>
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Name" value={profile.name} />
              <InfoRow label="Email" value={profile.email} />
              <button className={styles.btnGhost} style={{ marginTop: 16 }} onClick={() => setEditingProfile(true)} type="button">
                Edit profile
              </button>
            </>
          )}
        </div>

        <div className={styles.infoCard}>
          <AdminPasswordChange />
        </div>

        <div className={styles.infoCard}>
          <h3 className={styles.infoCardTitle}>Global Defaults</h3>
          {editingDefaults ? (
            <>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Default plan</label>
                <select className="input" value={defaults.defaultPlan} onChange={(event) => setDefaults((current) => ({ ...current, defaultPlan: event.target.value === "pro" ? "pro" : "starter" }))}>
                  <option value="starter">starter</option>
                  <option value="pro">pro</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Trial period</label>
                <input className="input" value={defaults.trialPeriod} onChange={(event) => setDefaults((current) => ({ ...current, trialPeriod: event.target.value }))} />
              </div>
              <div className={styles.inlineFormActions}>
                <button className={styles.btnGhostSm} onClick={() => setEditingDefaults(false)} type="button">
                  Cancel
                </button>
                <button className={styles.btnGhost} style={{ marginTop: 16 }} onClick={saveDefaults} type="button">
                  Save defaults
                </button>
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Default plan" value={defaults.defaultPlan} />
              <InfoRow label="Trial period" value={defaults.trialPeriod} />
              <button className={styles.btnGhost} style={{ marginTop: 16 }} onClick={() => setEditingDefaults(true)} type="button">
                Edit defaults
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <p style={{ color: message.type === "error" ? "#f87171" : "#4ade80", fontSize: 12, marginTop: 16 }}>
          {message.text}
        </p>
      )}
    </div>
  );
}

function AdminPasswordChange() {
  const [current, setCurrent] = useState("");
  const [fresh, setFresh] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, fresh: false, confirm: false });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (fresh.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (fresh !== confirm) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: fresh }),
      });
      setSuccess(true);
      setCurrent("");
      setFresh("");
      setConfirm("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h3 className={styles.infoCardTitle}>Change Password</h3>
      <form onSubmit={handleSubmit} className={styles.passwordForm}>
        <PasswordInput
          placeholder="Current password"
          value={current}
          visible={showPass.current}
          onChange={setCurrent}
          onToggle={() => setShowPass((currentState) => ({ ...currentState, current: !currentState.current }))}
        />
        <PasswordInput
          placeholder="New password (min 6 chars)"
          value={fresh}
          visible={showPass.fresh}
          onChange={setFresh}
          onToggle={() => setShowPass((currentState) => ({ ...currentState, fresh: !currentState.fresh }))}
        />
        <PasswordInput
          placeholder="Confirm new password"
          value={confirm}
          visible={showPass.confirm}
          onChange={setConfirm}
          onToggle={() => setShowPass((currentState) => ({ ...currentState, confirm: !currentState.confirm }))}
        />

        {error && <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
        {success && <p style={{ color: "#4ade80", fontSize: 12 }}>Password updated successfully.</p>}
        <button type="submit" className={styles.btnPrimary} style={{ width: "auto", marginTop: 4 }} disabled={loading}>
          {loading ? "Saving..." : "Change Password"}
        </button>
      </form>
    </>
  );
}

function PasswordInput({
  placeholder,
  value,
  visible,
  onChange,
  onToggle,
}: {
  placeholder: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className={styles.passwordField}>
      <input
        type={visible ? "text" : "password"}
        className="input"
        style={{ paddingRight: 40 }}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      <button type="button" className={styles.passwordToggle} onClick={onToggle}>
        {visible ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function NewClientModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    industry: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    plan: "starter" | "pro";
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("SaaS");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro">("starter");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");
    setSaving(true);
    try {
      await onCreate({
        name,
        industry,
        contactName,
        contactEmail,
        contactPhone,
        plan,
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New Client</h2>
          <button className={styles.modalClose} onClick={onClose} type="button">
            x
          </button>
        </div>
        <div className={styles.modalBody}>
          {[
            { label: "Company name", value: name, set: setName, placeholder: "Acme Corp" },
            { label: "Industry", value: industry, set: setIndustry, placeholder: "SaaS" },
            { label: "Contact name", value: contactName, set: setContactName, placeholder: "Jane Smith" },
            { label: "Contact email", value: contactEmail, set: setContactEmail, placeholder: "jane@acme.co.za", type: "email" },
            { label: "Contact phone", value: contactPhone, set: setContactPhone, placeholder: "+27 82 555 0182", type: "tel" },
          ].map((field) => (
            <div key={field.label} className={styles.formField}>
              <label className={styles.fieldLabel}>{field.label}</label>
              <input className="input" type={field.type ?? "text"} placeholder={field.placeholder} value={field.value} onChange={(event) => field.set(event.target.value)} />
            </div>
          ))}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Plan</label>
            <div className={styles.planPicker}>
              {(["starter", "pro"] as const).map((planOption) => (
                <button
                  key={planOption}
                  className={`${styles.planOption} ${plan === planOption ? styles.planSelected : ""}`}
                  onClick={() => setPlan(planOption)}
                  type="button"
                >
                  <span className={styles.planName}>{planOption}</span>
                  <span className={styles.planPrice}>{planOption === "starter" ? "R299/mo" : "R799/mo"}</span>
                </button>
              ))}
            </div>
          </div>
          {error && <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={styles.btnPrimary} style={{ width: "auto" }} onClick={() => void handleCreate()} disabled={!name || !contactEmail || saving} type="button">
            {saving ? "Saving..." : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      <span className={styles.infoValue}>{value || "-"}</span>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) {
    return <p className={styles.emptyState}>No records found.</p>;
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableOverflow}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row.join("-")}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className={styles.tdMuted}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
