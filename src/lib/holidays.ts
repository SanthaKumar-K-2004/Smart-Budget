// Public/bank holidays via Nager.Date (https://date.nager.at) — a free,
// open-source public holiday API with no API key required. Useful for a
// budgeting app because bank holidays affect when salary deposits, bill
// payments, and transfers actually clear.

export interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

const CACHE_KEY = "smartbudget:holidays-cache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export const HOLIDAY_COUNTRIES = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "SG", label: "Singapore" },
  { code: "JP", label: "Japan" },
];

export async function fetchUpcomingHolidays(countryCode: string): Promise<Holiday[] | null> {
  try {
    const cacheKey = `${CACHE_KEY}:${countryCode}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${countryCode}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Holiday[];
    writeCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

function readCache(key: string): Holiday[] | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: Holiday[]) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch {
    // best-effort cache only
  }
}
