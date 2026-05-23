import * as SecureStore from "expo-secure-store";

// Set EXPO_PUBLIC_API_URL in your .env file for local dev
// e.g. EXPO_PUBLIC_API_URL=http://192.168.1.x:3000
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "https://kotseko.vercel.app";

const TOKEN_KEY = "auth_token";
const COOKIE_NAME_KEY = "auth_cookie_name";

export async function saveAuth(token: string, cookieName: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(COOKIE_NAME_KEY, cookieName);
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(COOKIE_NAME_KEY);
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const cookieName = await SecureStore.getItemAsync(COOKIE_NAME_KEY);
  if (!token || !cookieName) return {};
  return { Cookie: `${cookieName}=${token}` };
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

// Generic authenticated fetch
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// Multipart upload (no Content-Type — browser sets boundary automatically)
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Upload failed: ${res.status}`);
  }
  return res.json();
}

// Converts a blob/relative path to a full URL.
// Pass auth headers separately to expo-image source.headers.
export function blobImageUri(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.includes("blob.vercel-storage.com")) {
    return `${API_BASE}/api/blob-image?url=${encodeURIComponent(path)}`;
  }
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return path;
}
