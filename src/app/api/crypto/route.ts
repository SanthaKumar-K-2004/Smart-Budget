import { NextResponse } from "next/server";

const CACHE_TTL_MS = 60 * 1000; // 60 seconds server-side cache
const cache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vsCurrency = searchParams.get("vs_currency") || "inr";
    const ids = searchParams.get("ids") || "";

    if (!ids) {
      return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
    }

    const cacheKey = `${vsCurrency}:${ids}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, max-age=${Math.round(
            (CACHE_TTL_MS - (Date.now() - cached.timestamp)) / 1000
          )}`,
        },
      });
    }

    const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
    url.searchParams.set("vs_currency", vsCurrency.toLowerCase());
    url.searchParams.set("ids", ids);
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("sparkline", "false");
    url.searchParams.set("price_change_percentage", "24h");

    // Add API key from environment if configured
    const key = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY;
    if (key) {
      url.searchParams.set("x_cg_demo_api_key", key);
    }

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(6000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      // If public API fails (e.g. rate limit), return stale cache if exists
      if (cached) {
        return NextResponse.json(cached.data);
      }
      return NextResponse.json({ error: "Failed to fetch from CoinGecko" }, { status: res.status });
    }

    const data = await res.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error("Crypto API Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
