import { NextResponse } from "next/server";
import { getBatchLivePrices } from "@/lib/live-market";
import { TOKENIZED_STOCKS } from "@/lib/tokenized-stocks";

export const revalidate = 30; // 30-second ISR caching

export async function GET() {
  try {
    const tickers = TOKENIZED_STOCKS.map((s) => s.ticker);
    const quotes = await getBatchLivePrices(tickers);

    const liveStocks = TOKENIZED_STOCKS.map((stock) => {
      const q = quotes[stock.ticker];
      if (q && q.price > 0) {
        const isPos = q.change24hPct >= 0;
        return {
          ...stock,
          price: `$${q.price.toFixed(2)}`,
          priceNumber: q.price,
          change24h: `${isPos ? "+" : ""}${q.change24hPct.toFixed(2)}%`,
          isPositive: isPos,
          lastUpdated: q.lastUpdated,
        };
      }
      return stock;
    });

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      stocks: liveStocks,
    });
  } catch (error) {
    console.error("Live market route error:", error);
    return NextResponse.json(
      { success: false, stocks: TOKENIZED_STOCKS },
      { status: 500 }
    );
  }
}
