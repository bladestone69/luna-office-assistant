// Trello integration — creates a card when a lead is added

const TRELLO_BASE = "https://api.trello.com/1";

interface TrelloCard {
  id: string;
  shortUrl: string;
}

export async function createTrelloCard(opts: {
  apiKey: string;
  token: string;
  boardId: string;
  listId: string;
  name: string;
  desc: string;
}): Promise<TrelloCard> {
  const { apiKey, token, listId, name, desc } = opts;
  const url = `${TRELLO_BASE}/cards?key=${apiKey}&token=${token}&idList=${listId}&name=${encodeURIComponent(name)}&desc=${encodeURIComponent(desc)}`;

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getTrelloLists(opts: {
  apiKey: string;
  token: string;
  boardId: string;
}) {
  const { apiKey, token, boardId } = opts;
  const res = await fetch(`${TRELLO_BASE}/boards/${boardId}/lists?key=${apiKey}&token=${token}&fields=id,name`);
  if (!res.ok) throw new Error(`Trello lists error ${res.status}`);
  return res.json();
}

export async function getTrelloBoards(opts: {
  apiKey: string;
  token: string;
}) {
  const { apiKey, token } = opts;
  const res = await fetch(`${TRELLO_BASE}/members/me/boards?key=${apiKey}&token=${token}&fields=id,name`);
  if (!res.ok) throw new Error(`Trello boards error ${res.status}`);
  return res.json();
}

export function formatLeadCard(lead: {
  name?: string | null;
  phone: string;
  email?: string | null;
  topic?: string | null;
  source?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
}): { name: string; desc: string } {
  const name = `${lead.topic ?? "New Lead"} — ${lead.name ?? lead.phone}`;
  const lines = [
    `**Phone:** ${lead.phone}`,
    lead.email ? `**Email:** ${lead.email}` : null,
    lead.topic ? `**Topic:** ${lead.topic}` : null,
    lead.source ? `**Source:** ${lead.source}` : null,
    lead.notes ? `**Notes:** ${lead.notes}` : null,
    lead.createdAt ? `**Received:** ${new Date(lead.createdAt).toLocaleString()}` : null,
  ].filter(Boolean);

  return { name, desc: lines.join("\n") };
}
