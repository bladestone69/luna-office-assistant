export type DashboardCall = {
  id: string;
  name: string;
  number: string;
  startedAt: string;
  timeLabel: string;
  outcome: string;
  durationSeconds: number;
};

export type DashboardLead = {
  id: string;
  name: string;
  phone: string;
  topic: string;
  status: string;
  source: string;
  createdAt: string;
  timeLabel: string;
};

export type DashboardData = {
  user: {
    id: string;
    name: string;
    email: string;
    clientId: string;
    role: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    status: string;
    industry: string;
  };
  stats: {
    missedCalls: number;
    newLeads: number;
    totalCalls: number;
  };
  recentCalls: DashboardCall[];
  recentLeads: DashboardLead[];
  ai: {
    active: boolean;
    agentCount: number;
    phoneNumberCount: number;
    primaryNumber: string;
    hasTrello: boolean;
  };
  team: {
    memberCount: number;
  };
};
