import { NextResponse } from "next/server";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour server-side cache for exchange rates
const cache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base") || "INR";

    const cached = cache.get(base);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, max-age=${Math.round(
            (CACHE_TTL_MS - (Date.now() - cached.timestamp)) / 1000
          )}`,
        },
      });
    }

    const url = `https://api.frankfurter.dev/v1/latest?base=${base}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (cached) {
        return NextResponse.json(cached.data);
      }
      return NextResponse.json({ error: "Failed to fetch from Frankfurter" }, { status: res.status });
    }

    const data = await res.json();
    cache.set(base, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Exchange Rates API Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
