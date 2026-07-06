// Safe localStorage wrapper — never throws, degrades gracefully in
// private-browsing / storage-disabled / quota-exceeded scenarios.

const MEMORY_FALLBACK = new Map<string, string>();
let warned = false;

function isStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const testKey = "__sb_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    if (isStorageAvailable()) {
      return window.localStorage.getItem(key);
    }
    return MEMORY_FALLBACK.get(key) ?? null;
  } catch {
    return MEMORY_FALLBACK.get(key) ?? null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    if (isStorageAvailable()) {
      window.localStorage.setItem(key, value);
      return true;
    }
    MEMORY_FALLBACK.set(key, value);
    if (!warned && typeof window !== "undefined") {
      warned = true;
      console.warn("SmartBudget: localStorage unavailable — using in-memory storage (data will not persist across reloads).");
    }
    return false;
  } catch (e) {
    MEMORY_FALLBACK.set(key, value);
    if (!warned) {
      warned = true;
      console.warn("SmartBudget: failed to persist to localStorage.", e);
    }
    return false;
  }
}

export function safeGetJSON<T>(key: string): T | null {
  const item = safeGetItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
}

export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
