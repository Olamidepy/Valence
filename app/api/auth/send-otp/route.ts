import { NextRequest, NextResponse } from "next/server";
import { generateOtpCode, setOtpForEmail } from "@/lib/otp-store";
import { sendEmailOtp } from "@/lib/auth-email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Generate 6-digit code
    const code = generateOtpCode();

    // Check cooldown and set in store
    const { allowed, waitSeconds } = setOtpForEmail(normalizedEmail, code);
    if (!allowed) {
      return NextResponse.json(
        {
          error: `Please wait ${waitSeconds}s before requesting another verification code.`,
          waitSeconds,
        },
        { status: 429 }
      );
    }

    // Send via Resend to Gmail / email provider
    const sendResult = await sendEmailOtp({
      toEmail: normalizedEmail,
      otpCode: code,
    });

    if (!sendResult.success) {
      console.warn("[Resend Send Failed]:", sendResult.error);
      
      // If Resend restricted test account error (only sending to registered address)
      const isRestrictedError = sendResult.error?.includes("You can only send testing emails to your own email address");
      
      return NextResponse.json({
        success: true, // Allow user to test with devCode fallback in development
        delivered: false,
        isRestricted: isRestrictedError,
        error: sendResult.error,
        message: isRestrictedError 
          ? `Resend free tier only sends live emails to your registered Resend account address. For testing this email, use test code below.` 
          : sendResult.error,
        devCode: code,
      });
    }

    return NextResponse.json({
      success: true,
      delivered: true,
      message: `Verification code successfully delivered to ${normalizedEmail}! Check your inbox.`,
    });
  } catch (error: any) {
    console.error("[Send OTP API Error]:", error);
    return NextResponse.json(
      { error: "Failed to dispatch verification code. Please try again." },
      { status: 500 }
    );
  }
}
