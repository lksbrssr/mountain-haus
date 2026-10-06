// Shared between the edge middleware and the API route, so both agree on the
// cookie value. The cookie is a SHA-256 of the site password — not reversible,
// and useless without knowing the password. Good enough to gate a holiday home.
export const ACCESS_COOKIE = "hh_access";

export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`haus-am-see:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
