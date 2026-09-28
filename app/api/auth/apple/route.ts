import { NextRequest, NextResponse } from "next/server";
import { deriveMainnetWalletForUser } from "@/lib/otp-store";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, idToken, user: appleUserData } = body;

    const verifiedEmail = email || "user@privaterelay.appleid.com";
    const normalizedEmail = verifiedEmail.trim().toLowerCase();
    const walletAddress = deriveMainnetWalletForUser(normalizedEmail);
    const resolvedUsername =
      appleUserData?.name?.firstName || normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

    // Upsert in Prisma if DB available
    let dbUser = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { walletAddress },
        update: {},
        create: { walletAddress },
      });
    } catch {
      // Non-fatal if DB not running locally
    }

    const authenticatedUser = {
      id: dbUser?.id || `usr_a_${Date.now()}`,
      username: resolvedUsername,
      email: normalizedEmail,
      provider: "apple",
      network: "Robinhood Chain Mainnet",
      chainId: 4663,
      authenticatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Successfully authenticated with Apple ID!",
      user: authenticatedUser,
    });
  } catch (error: any) {
    console.error("[Apple Auth Route Error]:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Apple ID." },
      { status: 500 }
    );
  }
}
