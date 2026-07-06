import { NextResponse } from "next/server";

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds server-side cache
const cache = new Map<string, { data: CoinMarketData[]; timestamp: number }>();

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

    // Retrieve client-supplied key from request headers or environment
    const customKey = request.headers.get("X-CoinGecko-Key");
    if (customKey) {
      url.searchParams.set("x_cg_demo_api_key", customKey);
    } else {
      const envKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY;
      if (envKey) {
        url.searchParams.set("x_cg_demo_api_key", envKey);
      }
    }

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(6000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (cached) {
        return NextResponse.json(cached.data);
      }
      return NextResponse.json({ error: "Failed to fetch from CoinGecko" }, { status: res.status });
    }

    const data = (await res.json()) as CoinMarketData[];
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
