// Client helpers for the Group Booking feature. Talks to the shared backend
// (the same Fly.io server the shopping comments use) via NEXT_PUBLIC_COMMENTS_API.
// When the API is unset the pages still render, just without shared state.

import type { Availability, WeekendOption } from "@/lib/weekends";

export const GROUPS_API =
  process.env.NEXT_PUBLIC_COMMENTS_API?.replace(/\/$/, "") || "";

export type Group = {
  id: string;
  title: string;
  organizer: string;
  createdAt: number;
  weekends: WeekendOption[];
  availability: Record<string, Record<string, Availability>>;
};

export type GroupSummary = {
  id: string;
  title: string;
  organizer: string;
  createdAt: number;
  weekends: WeekendOption[];
  people: number;
};

export async function listGroups(): Promise<GroupSummary[]> {
  if (!GROUPS_API) return [];
  const r = await fetch(`${GROUPS_API}/api/groups`, { cache: "no-store" });
  if (!r.ok) throw new Error("Couldn't load groups");
  return r.json();
}

export async function getGroup(id: string): Promise<Group | null> {
  if (!GROUPS_API) return null;
  const r = await fetch(`${GROUPS_API}/api/groups/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Couldn't load this group");
  return r.json();
}

export async function createGroup(input: {
  title: string;
  organizer: string;
  weekends: WeekendOption[];
}): Promise<Group> {
  if (!GROUPS_API) throw new Error("Sharing backend not configured");
  const r = await fetch(`${GROUPS_API}/api/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d.error || "Couldn't create the group");
  }
  return r.json();
}

export async function setAvailability(
  groupId: string,
  author: string,
  weekend: string,
  state: Availability | null,
): Promise<void> {
  if (!GROUPS_API) return;
  await fetch(
    `${GROUPS_API}/api/groups/${encodeURIComponent(groupId)}/availability`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, weekend, state }),
    },
  );
}

export async function removePerson(
  groupId: string,
  author: string,
): Promise<void> {
  if (!GROUPS_API) return;
  await fetch(
    `${GROUPS_API}/api/groups/${encodeURIComponent(groupId)}/remove`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author }),
    },
  );
}

export async function deleteGroup(
  groupId: string,
  author: string,
): Promise<void> {
  if (!GROUPS_API) return;
  await fetch(
    `${GROUPS_API}/api/groups/${encodeURIComponent(groupId)}?author=${encodeURIComponent(author)}`,
    { method: "DELETE" },
  );
}
