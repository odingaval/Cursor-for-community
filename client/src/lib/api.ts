/** Browser uses same-origin /api (proxied by Next.js). Server-side uses port 4000. */
function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") return "";
  return "http://localhost:4000";
}

export interface RoomData {
  id: string;
  name: string;
  createdAt: number;
  activeFile: string;
  participants: Array<{
    id: string;
    name: string;
    color: string;
    role: string;
    canEdit: boolean;
  }>;
  files: Array<{ path: string; language: string; content: string }>;
  humanChat: Array<{
    id: string;
    userName: string;
    content: string;
    timestamp: number;
  }>;
  aiChat: Array<{ id: string; role: string; content: string; timestamp: number }>;
}

export async function createRoom(name?: string): Promise<{ room: RoomData }> {
  const base = resolveApiUrl();
  const endpoint = `${base}/api/rooms`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  } catch {
    throw new Error(
      "Cannot reach API. Run from project root: npm run dev (needs port 4000 + 3000)."
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to create room (${res.status})${body ? `: ${body}` : ""}`);
  }
  return parseJsonResponse<{ room: RoomData }>(res);
}

export async function getRoom(id: string): Promise<{ room: RoomData } | null> {
  const base = resolveApiUrl();
  const res = await fetch(`${base}/api/rooms/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch room");
  return parseJsonResponse<{ room: RoomData }>(res);
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error("Empty response from server — is the API running on port 4000?");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON from server");
  }
}

export function getApiBase(): string {
  return resolveApiUrl() || "(proxied via Next.js)";
}
