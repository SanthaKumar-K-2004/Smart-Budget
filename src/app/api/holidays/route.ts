import { NextResponse } from "next/server";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours server-side cache for holidays
const cache = new Map<string, { data: unknown; timestamp: number }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = (searchParams.get("country") || "IN").toUpperCase();

    const cached = cache.get(country);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, max-age=${Math.round(
            (CACHE_TTL_MS - (Date.now() - cached.timestamp)) / 1000
          )}`,
        },
      });
    }

    const url = `https://date.nager.at/api/v3/NextPublicHolidays/${country}`;

    // Support client custom key in proxy if available
    const customKey = request.headers.get("X-NagerDate-Key");
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (customKey) {
      headers["Authorization"] = `Bearer ${customKey}`;
    }

    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers,
    });

    if (!res.ok) {
      if (cached) {
        return NextResponse.json(cached.data);
      }
      return NextResponse.json({ error: "Failed to fetch from Nager.Date" }, { status: res.status });
    }

    const data = await res.json();
    cache.set(country, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Holidays API Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
