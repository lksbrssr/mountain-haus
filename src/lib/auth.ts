// Shared between the edge middleware and the API route, so both agree on the
// cookie value. The cookie is a SHA-256 of the site password — not reversible,
// and useless without knowing the password. Good enough to gate a holiday home.
export const ACCESS_COOKIE = "hh_access";
// Separate cookie for the private /admin area (owner-only).
export const ADMIN_COOKIE = "hh_admin";

async function hash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function tokenFor(password: string): Promise<string> {
  return hash(`haus-am-see:${password}`);
}

export function adminTokenFor(password: string): Promise<string> {
  return hash(`haus-am-see-admin:${password}`);
}
