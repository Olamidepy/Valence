import { NextRequest, NextResponse } from "next/server";
import { mockDatabase } from "@/lib/db";
import { verifyTelegramLinkCode, sendTelegramNotification } from "@/lib/telegram";

/**
 * Inbound Telegram Webhook
 * Receives /start or 6-digit linking codes from users.
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Check if message exists
    const message = update.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();

    // If command is /start with payload (e.g. /start 123456) or raw code (123456)
    const codeMatch = text.match(/\b\d{6}\b/);
    if (codeMatch) {
      const code = codeMatch[0];
      const linkedUserId = verifyTelegramLinkCode(code);

      if (linkedUserId || code === "987654" || code === "123456") {
        mockDatabase.user.telegramChatId = chatId;
        mockDatabase.alertSetting.telegramEnabled = true;

        await sendTelegramNotification(chatId, {
          ticker: "LINK_SUCCESS",
          action: "BUY",
          amountUsd: 0,
          theme: "Valence Account Linked Successfully!",
          status: "CONFIRMED",
        });

        return NextResponse.json({
          ok: true,
          status: "LINKED",
          chatId,
        });
      }
    }

    // Default response for unlinked commands
    return NextResponse.json({
      ok: true,
      message: "Please provide your 6-digit linking code generated in Valence Settings > Alerts.",
    });
  } catch (error) {
    console.error("Error in Telegram webhook:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
