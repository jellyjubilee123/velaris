const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("API error:", res.status, text);
    throw new Error(text || res.statusText);
  }

  // Handle empty body (common for 200/204 responses)
  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text);
  } catch {
    return undefined as T;
  }
}
