// Public/bank holidays via Nager.Date (https://date.nager.at) — a free,
// open-source public holiday API with no API key required. Useful for a
// budgeting app because bank holidays affect when salary deposits, bill
// payments, and transfers actually clear.

import { getApiConfig } from "@/lib/config";

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

export const FALLBACK_IN_HOLIDAYS: Holiday[] = [
  { date: "2026-01-26", localName: "Republic Day", name: "Republic Day", countryCode: "IN" },
  { date: "2026-03-03", localName: "Maha Shivaratri", name: "Maha Shivaratri", countryCode: "IN" },
  { date: "2026-03-17", localName: "Holi", name: "Holi", countryCode: "IN" },
  { date: "2026-04-02", localName: "Good Friday", name: "Good Friday", countryCode: "IN" },
  { date: "2026-04-14", localName: "Dr. Ambedkar Jayanti", name: "Dr. Ambedkar Jayanti", countryCode: "IN" },
  { date: "2026-05-01", localName: "May Day / Maharashtra Day", name: "May Day", countryCode: "IN" },
  { date: "2026-08-15", localName: "Independence Day", name: "Independence Day", countryCode: "IN" },
  { date: "2026-08-27", localName: "Raksha Bandhan", name: "Raksha Bandhan", countryCode: "IN" },
  { date: "2026-09-04", localName: "Krishna Janmashtami", name: "Krishna Janmashtami", countryCode: "IN" },
  { date: "2026-10-02", localName: "Mahatma Gandhi Jayanti", name: "Mahatma Gandhi Jayanti", countryCode: "IN" },
  { date: "2026-10-20", localName: "Dussehra / Vijayadashami", name: "Dussehra", countryCode: "IN" },
  { date: "2026-11-08", localName: "Diwali / Deepavali", name: "Diwali", countryCode: "IN" },
  { date: "2026-12-25", localName: "Christmas Day", name: "Christmas Day", countryCode: "IN" },
];

export async function fetchUpcomingHolidays(countryCode: string): Promise<Holiday[] | null> {
  const normCountry = (countryCode || "IN").toUpperCase();
  try {
    const cacheKey = `${CACHE_KEY}:${normCountry}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const cfg = getApiConfig();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (cfg.nagerKey) {
      headers["X-NagerDate-Key"] = cfg.nagerKey;
    }

    const res = await fetch(`/api/holidays?country=${normCountry}`, {
      signal: AbortSignal.timeout(6000),
      headers,
    });
    if (!res.ok) throw new Error("API call failed");
    const data = (await res.json()) as Holiday[];
    writeCache(cacheKey, data);
    return data;
  } catch {
    // If offline or API fails, return local fallback for India or an empty list
    if (normCountry === "IN") {
      return FALLBACK_IN_HOLIDAYS;
    }
    return [];
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
