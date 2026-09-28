/**
 * Valence Telegram Alert & Webhook Module (Phase 7)
 * Handles user chat linking via one-time pairing codes and broadcasts trade execution alerts.
 */

// In-memory or temporary store for linking codes: code -> userId
const pairingCodes = new Map<string, { userId: string; expiresAt: number }>();

export function generateTelegramLinkCode(userId: string): string {
  // Generate a clean 6-digit linking code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Valid for 15 minutes
  pairingCodes.set(code, {
    userId,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });
  return code;
}

export function verifyTelegramLinkCode(code: string): string | null {
  const cleanCode = code.trim();
  const entry = pairingCodes.get(cleanCode);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pairingCodes.delete(cleanCode);
    return null;
  }
  pairingCodes.delete(cleanCode);
  return entry.userId;
}

export interface TradeNotificationPayload {
  ticker: string;
  action: "BUY" | "SELL" | "REBALANCE" | "REJECTED";
  amountUsd: number;
  txHash?: string;
  rejectionReason?: string;
  theme?: string;
  status: "CONFIRMED" | "FAILED";
}

/**
 * Send trade execution or guardrail rejection notification to user's Telegram chat
 */
export async function sendTelegramNotification(
  chatId: string,
  payload: TradeNotificationPayload
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("Mock")) {
    console.log(
      `[Telegram Mock Push] Message to chatId ${chatId}: ${formatTelegramMessage(payload)}`
    );
    return true;
  }

  try {
    const text = formatTelegramMessage(payload);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to push Telegram alert:", error);
    return false;
  }
}

export function formatTelegramMessage(payload: TradeNotificationPayload): string {
  if (payload.action === "REJECTED" || payload.status === "FAILED") {
    return `🚨 *Valence Guardrail Intervention*\n\n` +
      `Asset: *${payload.ticker}*\n` +
      `Amount: *$${payload.amountUsd.toFixed(2)}*\n` +
      `Action: *BLOCKED BY DETERMINISTIC GUARDRAILS*\n` +
      `Reason: _${payload.rejectionReason || "Exceeded safety thresholds"}\n\n` +
      `🛡️ *Your capital was protected.* No funds were moved.`;
  }

  return `✅ *Valence Auto-Invest Execution*\n\n` +
    `Goal: *${payload.theme || "Robinhood Chain Basket"}*\n` +
    `Asset: *${payload.ticker} (Tokenized Equity)*\n` +
    `Amount: *$${payload.amountUsd.toFixed(2)} USD*\n` +
    `Status: *CONFIRMED on Robinhood Chain*\n` +
    (payload.txHash ? `Explorer Tx: [${payload.txHash.slice(0, 10)}...](${`https://explorer.robinhoodchain.org/tx/${payload.txHash}`})\n\n` : `\n`) +
    `⚡ Automatic recurring cadence executed safely through Permit2.`;
}
