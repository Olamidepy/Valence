import { NextRequest, NextResponse } from "next/server";
import { verifyOtpForEmail, deriveMainnetWalletForUser } from "@/lib/otp-store";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, username } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP code
    const verification = verifyOtpForEmail(normalizedEmail, code);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason || "Invalid code." },
        { status: 400 }
      );
    }

    // Derive Robinhood Chain Mainnet Wallet
    const walletAddress = deriveMainnetWalletForUser(normalizedEmail);
    const resolvedUsername =
      username?.trim() || normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

    // Persist or upsert user in database if PostgreSQL is reachable
    let dbUser = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { walletAddress },
        update: {},
        create: {
          walletAddress,
        },
      });
    } catch (dbErr) {
      // Non-fatal if local dev DB is not currently running
      console.warn("[Prisma User Upsert Notice]: Running in hybrid/mock DB mode.");
    }

    const authenticatedUser = {
      id: dbUser?.id || `usr_${Date.now()}`,
      username: resolvedUsername,
      email: normalizedEmail,
      provider: "email_otp",
      network: "Robinhood Chain Mainnet",
      chainId: 4663,
      authenticatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Authentication successful! Welcome to Valence.",
      user: authenticatedUser,
    });
  } catch (error: any) {
    console.error("[Verify OTP API Error]:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
