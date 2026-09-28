import { NextRequest, NextResponse } from "next/server";
import { mockDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const actionFilter = searchParams.get("action");
    const search = searchParams.get("search")?.toLowerCase();

    let trades = [...mockDatabase.trades];

    if (actionFilter && actionFilter !== "ALL") {
      trades = trades.filter((t) => t.action === actionFilter);
    }

    if (search) {
      trades = trades.filter(
        (t) =>
          t.ticker.toLowerCase().includes(search) ||
          (t.txHash && t.txHash.toLowerCase().includes(search)) ||
          (t.rejectionReason && t.rejectionReason.toLowerCase().includes(search))
      );
    }

    const totalVolumeUsd = trades.reduce((sum, t) => sum + t.amountUsd, 0);
    const confirmedCount = trades.filter((t) => t.status === "CONFIRMED").length;
    const rejectedCount = trades.filter((t) => t.action === "REJECTED").length;

    return NextResponse.json({
      trades,
      stats: {
        totalTrades: trades.length,
        confirmedCount,
        rejectedCount,
        totalVolumeUsd,
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/activity:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load activity" },
      { status: 500 }
    );
  }
}
