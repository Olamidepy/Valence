import { NextRequest, NextResponse } from "next/server";
import { TOKENIZED_STOCKS } from "@/lib/tokenized-stocks";
import { evaluateBasketGuardrails } from "@/lib/guardrails";
import { mockDatabase } from "@/lib/db";
import { executeBasketSwaps } from "@/lib/chain/execute";
import { getBatchLivePrices } from "@/lib/live-market";

/**
 * Model Context Protocol (MCP) Server for Robinhood Chain Mainnet
 * Enables autonomous AI agents (OpenServ, Claude, etc.) to query tokenized assets,
 * evaluate risk guardrails, and execute autonomous DCA swaps.
 */

const MCP_TOOLS = [
  {
    name: "robinhood_get_tokenized_equities",
    description: "Fetch all available tokenized US equities on Robinhood Chain Mainnet (Chain ID 4663) with real-time Chainlink oracle prices, liquidity pool depth, and Uniswap v4 contract addresses.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["All", "AI & Silicon", "Semiconductors", "Mega-Cap Tech", "ETFs"],
          description: "Optional filter by sector category",
        },
      },
    },
  },
  {
    name: "robinhood_evaluate_guardrails",
    description: "Audit a proposed equity portfolio against institutional risk guardrails (max 35% concentration per asset, minimum 2 assets, maximum 0.50% slippage tolerance).",
    inputSchema: {
      type: "object",
      required: ["holdings"],
      properties: {
        holdings: {
          type: "array",
          items: {
            type: "object",
            required: ["ticker", "weightPct"],
            properties: {
              ticker: { type: "string" },
              weightPct: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "robinhood_execute_dca_swap",
    description: "Execute an autonomous recurring DCA swap into tokenized equities on Robinhood Chain Mainnet via Permit2 and UniversalRouter.",
    inputSchema: {
      type: "object",
      required: ["amountUsd", "holdings"],
      properties: {
        amountUsd: { type: "number", description: "Gross USD amount to swap" },
        theme: { type: "string", description: "Investment thesis description" },
        holdings: {
          type: "array",
          items: {
            type: "object",
            required: ["ticker", "weightPct"],
            properties: {
              ticker: { type: "string" },
              weightPct: { type: "number" },
            },
          },
        },
      },
    },
  },
  {
    name: "robinhood_get_vault_metrics",
    description: "Query the active Robinhood Chain strategy vault balance, 24h performance, active scheduled goals, and accumulated protocol fee revenue.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params, id } = body;

    // 1. Tool Listing (MCP standard)
    if (method === "tools/list" || method === "mcp.list_tools") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: id ?? 1,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    // 2. Tool Execution (MCP standard)
    if (method === "tools/call" || method === "mcp.call_tool") {
      const toolName = params?.name || params?.tool;
      const args = params?.arguments || params?.args || {};

      switch (toolName) {
        case "robinhood_get_tokenized_equities": {
          const liveQuotes = await getBatchLivePrices(TOKENIZED_STOCKS.map((s) => s.ticker));
          let stocks = TOKENIZED_STOCKS.map((s) => ({
            ...s,
            price: liveQuotes[s.ticker]?.price ? `$${liveQuotes[s.ticker].price.toFixed(2)}` : s.price,
            priceNumber: liveQuotes[s.ticker]?.price ?? s.priceNumber,
          }));

          if (args.category && args.category !== "All") {
            stocks = stocks.filter((s) => s.category === args.category);
          }

          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? 1,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(stocks, null, 2),
                },
              ],
            },
          });
        }

        case "robinhood_evaluate_guardrails": {
          const proposal = {
            theme: "MCP Automated Proposal",
            rationale: "Automated risk check via Model Context Protocol",
            holdings: args.holdings,
          };
          const guardrailResult = evaluateBasketGuardrails(
            proposal as any,
            mockDatabase.guardrailConfig
          );

          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? 1,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(guardrailResult, null, 2),
                },
              ],
            },
          });
        }

        case "robinhood_execute_dca_swap": {
          const executionResult = await executeBasketSwaps({
            userId: mockDatabase.user.id,
            goalId: `mcp_goal_${Date.now()}`,
            theme: args.theme || "MCP Autonomous Execution",
            holdings: args.holdings.map((h: any) => ({
              ticker: h.ticker,
              weightPct: h.weightPct,
              amountUsd: Math.round(((args.amountUsd * h.weightPct) / 100) * 100) / 100,
            })),
          });

          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? 1,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(executionResult, null, 2),
                },
              ],
            },
          });
        }

        case "robinhood_get_vault_metrics": {
          const metrics = {
            chain: "Robinhood Chain Mainnet (4663)",
            totalVaultValueUsd: 2887.29,
            totalInvestedUsd: 2150.0,
            accumulatedFeeRevenueUsd: 14.43,
            managementFeeBps: 50,
            activeGoalsCount: mockDatabase.goals.length,
            recentTradesCount: mockDatabase.trades.length,
          };

          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? 1,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(metrics, null, 2),
                },
              ],
            },
          });
        }

        default:
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id: id ?? 1,
              error: { code: -32601, message: `Tool '${toolName}' not found` },
            },
            { status: 404 }
          );
      }
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: id ?? 1,
        error: { code: -32600, message: "Invalid JSON-RPC request" },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("MCP route error:", error);
    return NextResponse.json(
      { jsonrpc: "2.0", id: 1, error: { code: -32603, message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Discovery info for browsers or MCP inspectors
  return NextResponse.json({
    name: "Robinhood Chain MCP Server",
    version: "1.0.0",
    protocol: "Model Context Protocol (JSON-RPC 2.0)",
    chain: "Robinhood Chain Mainnet (ID: 4663)",
    toolsCount: MCP_TOOLS.length,
    tools: MCP_TOOLS,
  });
}
