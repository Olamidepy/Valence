import { NextRequest, NextResponse } from "next/server";
import { mockDatabase } from "@/lib/db";
import { generateTelegramLinkCode } from "@/lib/telegram";

export async function GET() {
  const code = generateTelegramLinkCode(mockDatabase.user.id);
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "ValenceAlphaBot";

  return NextResponse.json({
    code,
    botUsername,
    deepLink: `https://t.me/${botUsername}?start=${code}`,
    isLinked: Boolean(mockDatabase.user.telegramChatId),
    chatId: mockDatabase.user.telegramChatId,
    alertSettings: mockDatabase.alertSetting,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "SIMULATE_LINK") {
      mockDatabase.user.telegramChatId = "987654321";
      mockDatabase.alertSetting.telegramEnabled = true;
      return NextResponse.json({
        success: true,
        isLinked: true,
        chatId: "987654321",
        message: "Telegram successfully linked.",
      });
    }

    if (body.action === "UNLINK") {
      mockDatabase.user.telegramChatId = undefined;
      return NextResponse.json({
        success: true,
        isLinked: false,
      });
    }

    if (body.alertSettings) {
      mockDatabase.alertSetting = {
        ...mockDatabase.alertSetting,
        ...body.alertSettings,
      };
      return NextResponse.json({
        success: true,
        alertSettings: mockDatabase.alertSetting,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
