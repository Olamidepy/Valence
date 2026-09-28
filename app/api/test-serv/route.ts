import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey =
    req.nextUrl.searchParams.get("key") ||
    process.env.SERV_API_KEY ||
    "";

  const baseUrl = process.env.SERV_BASE_URL || "https://inference-api.openserv.ai/v1";
  const model = req.nextUrl.searchParams.get("model") || process.env.SERV_MODEL || "gpt-4o-mini";

  const results: any = {
    apiKeyPrefix: apiKey ? apiKey.slice(0, 10) + "..." : "none",
    baseUrl,
    modelTested: model,
  };

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Say hello in JSON format: {\"greeting\": \"hello\"}" }],
        response_format: { type: "json_object" },
      }),
    });

    results.status = res.status;
    results.statusText = res.statusText;
    const text = await res.text();
    try {
      results.body = JSON.parse(text);
    } catch {
      results.body = text;
    }
  } catch (err: any) {
    results.error = err.message || String(err);
  }

  return NextResponse.json(results);
}
