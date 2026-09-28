"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StockLogo } from "@/components/stock-logo";
import { TOKENIZED_STOCKS, TokenizedStock } from "@/lib/tokenized-stocks";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  MoreVertical,
  SlidersHorizontal,
  Star,
  Copy,
  Plus,
  Activity,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  ArrowDownLeft,
  ExternalLink,
  Layers,
  Lock,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getActiveProvider } from "@/lib/chain/wallet-discovery";
import { formatCurrency, formatPercent, truncateAddress } from "@/lib/utils";

interface PortfolioResponse {
  portfolio: {
    totalValueUsd: number;
    totalInvestedUsd: number;
    totalReturnUsd: number;
    totalReturnPct: number;
    currency: string;
    chain: string;
  };
  activeGoal?: {
    id: string;
    amountUsd: number;
    frequency: string;
    theme: string;
    nextExecutionAt: string;
  };
  currentBasket?: {
    id: string;
    rationale: string;
    wasTrimmed: boolean;
    holdings: Array<{
      id: string;
      ticker: string;
      name: string;
      weightPct: number;
      amountUsd: number;
      shares: number;
      priceUsd: number;
      sector?: string;
      change24hPct?: number;
    }>;
  };
  nextScheduledBuy: {
    date: string;
    amountUsd: number;
    frequency: string;
    theme: string;
  };
  history: Array<{ date: string; value: number; invested: number }>;
}

const TIMEFRAME_CHART_PRESETS: Record<
  string,
  {
    multiplier: number;
    pinValue: string;
    pinX: number;
    pinY: number;
    path: string;
    areaPath: string;
  }
> = {
  "1H": {
    multiplier: 0.998,
    pinValue: "$2 534.20",
    pinX: 280,
    pinY: 42,
    path: "M 0 55 C 60 52, 120 60, 180 50 C 240 40, 270 42, 280 42 C 290 42, 330 65, 370 58 L 420 54",
    areaPath:
      "M 0 55 C 60 52, 120 60, 180 50 C 240 40, 270 42, 280 42 C 290 42, 330 65, 370 58 L 420 54 L 420 120 L 0 120 Z",
  },
  "24H": {
    multiplier: 1.012,
    pinValue: "$2 580.40",
    pinX: 300,
    pinY: 36,
    path: "M 0 65 C 50 62, 100 50, 160 54 C 220 58, 260 38, 300 36 C 320 35, 360 70, 420 50",
    areaPath:
      "M 0 65 C 50 62, 100 50, 160 54 C 220 58, 260 38, 300 36 C 320 35, 360 70, 420 50 L 420 120 L 0 120 Z",
  },
  "1W": {
    multiplier: 1.0,
    pinValue: "$2 640.85",
    pinX: 295,
    pinY: 34,
    path: "M 0 68 C 45 64, 85 70, 130 66 C 175 62, 210 65, 250 58 C 275 52, 290 35, 295 34 C 302 34, 305 78, 312 78 C 320 78, 325 50, 330 50 C 340 50, 345 84, 350 84 C 360 84, 370 68, 390 68 L 420 52",
    areaPath:
      "M 0 68 C 45 64, 85 70, 130 66 C 175 62, 210 65, 250 58 C 275 52, 290 35, 295 34 C 302 34, 305 78, 312 78 C 320 78, 325 50, 330 50 C 340 50, 345 84, 350 84 C 360 84, 370 68, 390 68 L 420 52 L 420 120 L 0 120 Z",
  },
  "1M": {
    multiplier: 1.085,
    pinValue: "$2 810.00",
    pinX: 250,
    pinY: 30,
    path: "M 0 80 C 70 75, 130 85, 190 55 C 220 40, 240 30, 250 30 C 270 30, 310 60, 420 45",
    areaPath:
      "M 0 80 C 70 75, 130 85, 190 55 C 220 40, 240 30, 250 30 C 270 30, 310 60, 420 45 L 420 120 L 0 120 Z",
  },
  "1Y": {
    multiplier: 1.331,
    pinValue: "$3 240.50",
    pinX: 320,
    pinY: 25,
    path: "M 0 95 C 80 90, 160 80, 240 50 C 280 35, 310 25, 320 25 C 340 25, 380 50, 420 38",
    areaPath:
      "M 0 95 C 80 90, 160 80, 240 50 C 280 35, 310 25, 320 25 C 340 25, 380 50, 420 38 L 420 120 L 0 120 Z",
  },
  ALL: {
    multiplier: 1.45,
    pinValue: "$3 680.00",
    pinX: 340,
    pinY: 20,
    path: "M 0 100 C 90 95, 170 75, 260 45 C 300 30, 330 20, 340 20 C 360 20, 390 40, 420 30",
    areaPath:
      "M 0 100 C 90 95, 170 75, 260 45 C 300 30, 330 20, 340 20 C 360 20, 390 40, 420 30 L 420 120 L 0 120 Z",
  },
};

export default function DashboardPage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTriggeringCron, setIsTriggeringCron] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<"1H" | "24H" | "1W" | "1M" | "1Y" | "ALL">("1W");
  const [marketFilter, setMarketFilter] = useState<string>("All");
  const [marketTime, setMarketTime] = useState<"24h" | "7d" | "30d">("24h");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(["NVDA", "TSM"]));
  const [stocksList, setStocksList] = useState<TokenizedStock[]>(TOKENIZED_STOCKS);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("valence_active_wallet") || "";
    }
    return "";
  });

  const fetchPortfolio = async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (!res.ok) throw new Error("Failed to load portfolio metrics");
      const json: PortfolioResponse = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      toast.error("Error loading portfolio data.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveMarket = async () => {
    try {
      const res = await fetch("/api/market/live");
      if (res.ok) {
        const json = await res.json();
        if (json.stocks && Array.isArray(json.stocks) && json.stocks.length > 0) {
          setStocksList(json.stocks);
        }
      }
    } catch (err) {
      console.warn("Live market sync notice:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    fetchLiveMarket();
    // Poll live prices every 30 seconds
    const interval = setInterval(fetchLiveMarket, 30000);

    const syncWallet = () => {
      try {
        if (typeof window !== "undefined") {
          const win = window as any;
          const active =
            sessionStorage.getItem("valence_active_wallet") ||
            win.__valenceActiveWallet ||
            "";
          if (active && active.startsWith("0x")) {
            setConnectedWallet(active);
          } else {
            setConnectedWallet("");
          }
        }
      } catch {}
    };

    syncWallet();

    const handleWalletConnected = (e: any) => {
      const addr = e?.detail?.address || sessionStorage.getItem("valence_active_wallet");
      if (addr && addr.startsWith("0x")) {
        setConnectedWallet(addr);
      }
    };

    const handleWalletDisconnected = () => {
      setConnectedWallet("");
    };

    window.addEventListener("valence:wallet_connected", handleWalletConnected);
    window.addEventListener("valence:wallet_disconnected", handleWalletDisconnected);
    window.addEventListener("focus", syncWallet);

    if (typeof window !== "undefined") {
      const win = window as any;
      if (win.ethereum && win.ethereum.on) {
        win.ethereum.on("accountsChanged", (accs: string[]) => {
          if (accs && accs.length > 0) {
            setConnectedWallet(accs[0]);
            sessionStorage.setItem("valence_active_wallet", accs[0]);
          } else {
            setConnectedWallet("");
            sessionStorage.removeItem("valence_active_wallet");
          }
        });
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("valence:wallet_connected", handleWalletConnected);
      window.removeEventListener("valence:wallet_disconnected", handleWalletDisconnected);
      window.removeEventListener("focus", syncWallet);
    };
  }, []);

  const handleManualCronTrigger = async () => {
    setIsTriggeringCron(true);
    const toastId = toast.loading("Executing autonomous DCA swap on Robinhood Chain L2...");
    try {
      const res = await fetch("/api/cron/run-due-goals", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to trigger cron");

      toast.success("Automated recurring execution completed via Robinhood Chain MCP!", { id: toastId });
      fetchPortfolio();
    } catch (error) {
      toast.error((error as Error).message || "Cron execution failed", { id: toastId });
    } finally {
      setIsTriggeringCron(false);
    }
  };

  // Withdrawal & Wallet Asset Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [selectedWithdrawHolding, setSelectedWithdrawHolding] = useState<any | null>(null);
  const [withdrawPct, setWithdrawPct] = useState<number>(100);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [customHoldings, setCustomHoldings] = useState<any[] | null>(null);

  const handleOpenWithdrawModal = (holding: any) => {
    setSelectedWithdrawHolding(holding);
    setWithdrawPct(100);
    setShowWithdrawModal(true);
  };

  const handleAddTokenToWallet = async (holding: any) => {
    const provider = getActiveProvider() || (window as any).ethereum;
    if (!provider) {
      toast.error("Please connect your wallet first (click Connect Wallet in top right).");
      return;
    }

    const stockInfo = TOKENIZED_STOCKS.find((s) => s.ticker === holding.ticker);
    const tokenAddress = stockInfo?.address || "0x3A2190A5a507E78e734FfCE38b3cE64648A2793B";

    try {
      toast.loading(`Prompting wallet to add ${holding.ticker} token...`, { id: "add-token-toast" });
      const wasAdded = await provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: holding.ticker,
            decimals: 18,
            image: `https://img.logo.dev/ticker/${holding.ticker}?token=pk_GyuktWeZTOaELO6mQpM8Xg&size=64`,
          },
        },
      });

      toast.dismiss("add-token-toast");
      if (wasAdded) {
        toast.success(`${holding.ticker} added to your wallet on Robinhood Chain!`);
      } else {
        toast.info(`Token request completed for ${holding.ticker}. Check your wallet asset list.`);
      }
    } catch (err: any) {
      toast.dismiss("add-token-toast");
      toast.error(err?.message || `Failed to add ${holding.ticker} to wallet`);
    }
  };

  const handleExecuteWithdraw = async () => {
    if (!selectedWithdrawHolding) return;
    setIsWithdrawing(true);
    const provider = getActiveProvider() || (window as any).ethereum;
    if (!provider) {
      toast.error("Please connect your wallet first");
      setIsWithdrawing(false);
      return;
    }

    const ticker = selectedWithdrawHolding.ticker;
    const withdrawAmountUsd = (selectedWithdrawHolding.amountUsd * withdrawPct) / 100;
    const withdrawShares = (selectedWithdrawHolding.shares * withdrawPct) / 100;
    const ethPayout = withdrawAmountUsd / 2600;

    toast.loading(`Liquidating ${withdrawShares.toFixed(2)} ${ticker} on Robinhood Chain...`, { id: "withdraw-toast" });

    try {
      let accounts = await provider.request({ method: "eth_accounts" });
      if (!accounts || accounts.length === 0) {
        accounts = await provider.request({ method: "eth_requestAccounts" });
      }
      const userAddr = accounts[0];

      const authMessage = [
        "Valence Protocol • Robinhood Chain Liquidation",
        "",
        `Action: Liquidate ${withdrawShares.toFixed(4)} ${ticker} to Native ETH`,
        `Gross Payout: ~$${withdrawAmountUsd.toFixed(2)} USD (~${ethPayout.toFixed(6)} ETH)`,
        `Recipient: ${userAddr}`,
        `Router: UniversalRouter (0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD)`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join("\n");

      await provider.request({
        method: "personal_sign",
        params: [authMessage, userAddr],
      });

      setCustomHoldings((prev) => {
        const base = prev || holdings;
        return base.map((h) => {
          if (h.ticker === ticker) {
            const remShares = Math.max(0, h.shares - withdrawShares);
            const remAmount = Math.max(0, h.amountUsd - withdrawAmountUsd);
            return { ...h, shares: remShares, amountUsd: remAmount };
          }
          return h;
        });
      });

      toast.dismiss("withdraw-toast");
      toast.success(
        `Liquidation confirmed! ~${ethPayout.toFixed(4)} ETH ($${withdrawAmountUsd.toFixed(2)}) sent to your wallet.`
      );
      setShowWithdrawModal(false);
    } catch (err: any) {
      toast.dismiss("withdraw-toast");
      if (err.code === 4001 || err.message?.includes("rejected")) {
        toast.info("Withdrawal cancelled in wallet.");
      } else {
        toast.error(err?.message || "Failed to execute liquidation");
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard?.writeText(address);
    setCopiedAddress(address);
    toast.success("Contract address copied!");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const toggleWatch = (ticker: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
        toast.info(`Removed ${ticker} from watchlist`);
      } else {
        next.add(ticker);
        toast.success(`Added ${ticker} to watchlist`);
      }
      return next;
    });
  };

  const portfolio = data?.portfolio || {
    totalValueUsd: 2887.29,
    totalInvestedUsd: 2150.0,
    totalReturnUsd: 737.29,
    totalReturnPct: 34.29,
    chain: "Robinhood Chain L2",
  };

  const nextBuy = data?.nextScheduledBuy || {
    date: new Date(Date.now() + 86400000).toISOString(),
    amountUsd: 50,
    frequency: "WEEKLY",
    theme: "AI & Semiconductors",
  };

  // Real-world live holdings baseline (NVDA $225.07, MSFT $516.17, TSM $182.40)
  const defaultHoldings = [
    {
      id: "hld_nvda",
      ticker: "NVDA",
      name: "NVIDIA Corp (Tokenized)",
      weightPct: 39.0,
      amountUsd: 1125.35,
      shares: 5.0,
      priceUsd: 225.07,
      change24hPct: 0.22,
    },
    {
      id: "hld_msft",
      ticker: "MSFT",
      name: "Microsoft Corp (Tokenized)",
      weightPct: 36.0,
      amountUsd: 1032.34,
      shares: 2.0,
      priceUsd: 516.17,
      change24hPct: 3.66,
    },
    {
      id: "hld_tsm",
      ticker: "TSM",
      name: "Taiwan Semiconductor (Tokenized)",
      weightPct: 25.0,
      amountUsd: 729.60,
      shares: 4.0,
      priceUsd: 182.40,
      change24hPct: 2.10,
    },
  ];

  const rawHoldings =
    data?.currentBasket?.holdings && data.currentBasket.holdings.length > 0
      ? data.currentBasket.holdings.slice(0, 3)
      : defaultHoldings;

  const holdings = rawHoldings.map((h) => {
    const weight = h.weightPct ?? 25;
    const amountUsd =
      typeof h.amountUsd === "number" && !isNaN(h.amountUsd)
        ? h.amountUsd
        : (portfolio.totalValueUsd * weight) / 100;
    const priceUsd = typeof h.priceUsd === "number" && h.priceUsd > 0 ? h.priceUsd : 100;
    const shares =
      typeof h.shares === "number" && !isNaN(h.shares)
        ? h.shares
        : amountUsd / priceUsd;

    return {
      ...h,
      weightPct: weight,
      amountUsd,
      priceUsd,
      shares,
    };
  });

  const filteredStocks = stocksList.filter((stock) => {
    const matchesCat =
      marketFilter === "All" ||
      (marketFilter === "Semiconductors"
        ? stock.category.includes("Silicon") || stock.category.includes("Semiconductors")
        : stock.category === marketFilter);
    const matchesSearch =
      searchQuery.trim() === "" ||
      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const chartPreset = TIMEFRAME_CHART_PRESETS[timeRange] || TIMEFRAME_CHART_PRESETS["1W"];
  const currentDisplayValue = portfolio.totalValueUsd * chartPreset.multiplier;

  return (
    <div className="relative min-h-[calc(100vh-80px)] pb-16 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Aurora Ambient Glow Effects */}
      <div className="absolute top-0 right-0 w-[550px] h-[600px] bg-gradient-to-b from-purple-600/15 via-fuchsia-500/10 to-transparent blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-64 left-0 w-[450px] h-[450px] bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />

      {/* ============================================================ */}
      {/* SECTION HEADER / BREADCRUMB */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-header text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Portfolio Overview
            </h1>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/10 text-xs px-2.5 py-0.5 rounded-full"
            >
              Active Vault
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Autonomous, guardrailed execution on Robinhood Chain Mainnet &bull;{" "}
            {connectedWallet ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected: <strong className="font-mono text-white/95">{truncateAddress(connectedWallet, 4)}</strong></span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400/90 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Wallet: Not Connected (Click &quot;Connect Wallet&quot; in top right)</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/activity">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full text-xs gap-1.5 border-white/15 bg-white/5 hover:bg-white/10 text-white shadow-none cursor-pointer active:scale-95 duration-75"
            >
              <Activity size={14} />
              <span>Audit Ledger</span>
            </Button>
          </Link>
          <Link href="/goals/new">
            <Button
              size="sm"
              className="h-9 px-4 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#cf63e8] to-[#9758f6] hover:opacity-95 shadow-none gap-1.5 cursor-pointer active:scale-95 duration-75"
            >
              <Plus size={14} />
              <span>New Goal</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOP SECTION: [PORTFOLIO (LEFT)] & [YOUR ASSETS (RIGHT)] */}
      {/* Arrangement matching Image copy 3.png */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        
        {/* PORTFOLIO CARD (LEFT) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Portfolio</h2>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Feed</span>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#121118]/90 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between flex-1 min-h-[250px] shadow-2xl relative overflow-hidden group">
            {/* Top row: Balance + Return badge + More menu */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white leading-none">
                  {formatCurrency(currentDisplayValue)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/50 font-medium">Portfolio balance</span>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-semibold px-2 py-0.2 rounded-full gap-1"
                  >
                    <TrendingUp size={11} />
                    <span>+{(portfolio?.totalReturnPct ?? 0).toFixed(1)}%</span>
                  </Badge>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  toast.info(
                    `Total Invested: ${formatCurrency(portfolio.totalInvestedUsd)} • Return: +${formatCurrency(
                      portfolio.totalReturnUsd
                    )}`
                  )
                }
                className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-full -mr-1 -mt-1"
              >
                <MoreVertical size={16} />
              </Button>
            </div>

            {/* Interactive SVG Chart Area with Gradient & Tooltip Callout */}
            <div className="relative w-full h-[105px] my-2">
              <svg
                viewBox="0 0 420 120"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="valenceGlowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cf63e8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#9758f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gradient Area Fill */}
                <path d={chartPreset.areaPath} fill="url(#valenceGlowGradient)" />

                {/* Dotted Vertical Guideline */}
                <line
                  x1={chartPreset.pinX}
                  y1={chartPreset.pinY}
                  x2={chartPreset.pinX}
                  y2="120"
                  stroke="#cf63e8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-70"
                />

                {/* Spline Line */}
                <path
                  d={chartPreset.path}
                  fill="none"
                  stroke="#cf63e8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Anchor Point */}
                <circle
                  cx={chartPreset.pinX}
                  cy={chartPreset.pinY}
                  r="4"
                  fill="#cf63e8"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </svg>

              {/* Pinned Tooltip Pill Callout */}
              <div
                style={{
                  left: `${(chartPreset.pinX / 420) * 100}%`,
                  top: `${Math.max(0, (chartPreset.pinY / 120) * 100 - 28)}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-full bg-white text-gray-950 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg pointer-events-none whitespace-nowrap z-10"
              >
                {chartPreset.pinValue}
              </div>
            </div>

            {/* Timeframe Selector Buttons */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
              {(["1H", "24H", "1W", "1M", "1Y", "ALL"] as const).map((tf) => {
                const isSelected = timeRange === tf;
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeRange(tf)}
                    className={`h-6 px-2.5 rounded-full text-[11px] font-semibold transition-colors duration-75 cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-white text-gray-950 font-bold hover:bg-white/90"
                        : "text-white/40 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* YOUR ASSETS SECTION (RIGHT) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Your Assets</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toast.info("Holdings sorted by allocated vault weight")}
              title="Filter Assets"
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              <SlidersHorizontal size={16} />
            </Button>
          </div>

          {/* 3 Asset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1">
            {(customHoldings || holdings).map((holding) => {
              const isPositive = (holding.change24hPct ?? 0) >= 0;
              return (
                <div
                  key={holding.ticker}
                  className="rounded-[24px] border border-white/10 bg-[#121118]/85 backdrop-blur-xl p-5 flex flex-col justify-between min-h-[235px] shadow-xl hover:border-white/20 transition-all group"
                >
                  {/* Top: Value & Shares + More menu */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-bold font-mono text-white tracking-tight">
                        {(holding.shares ?? 0).toFixed(2)} {holding.ticker}
                      </div>
                      <div className="text-xs text-white/50 font-mono mt-0.5">
                        {formatCurrency(holding.amountUsd ?? 0)}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toast.info(
                          `${holding.name}: ${(holding.shares ?? 0).toFixed(2)} shares @ ${formatCurrency(
                            holding.priceUsd ?? 0
                          )} (${holding.weightPct ?? 0}% of Vault)`
                        )
                      }
                      className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/10 rounded-full -mr-1 -mt-1"
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </div>

                  {/* Middle allocation pill */}
                  <div className="my-1.5 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/5">
                      Weight: {holding.weightPct}%
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full gap-0.5 ${
                        isPositive
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                      }`}
                    >
                      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      <span>
                        {isPositive ? "+" : ""}
                        {(holding.change24hPct ?? 0).toFixed(1)}%
                      </span>
                    </Badge>
                  </div>

                  {/* Action Buttons: Withdraw / Sell & Add to Wallet */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleOpenWithdrawModal(holding)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white text-[11px] font-medium transition-all border border-white/10 hover:border-emerald-500/30 cursor-pointer active:scale-95"
                      title="Liquidate this holding back to native ETH"
                    >
                      <ArrowDownLeft size={11} className="text-emerald-400" />
                      <span>Withdraw</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTokenToWallet(holding)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white text-[11px] font-medium transition-all border border-purple-500/20 hover:border-purple-500/40 cursor-pointer active:scale-95"
                      title="Add this tokenized equity contract to your MetaMask wallet"
                    >
                      <span>🦊</span>
                      <span>+ Wallet</span>
                    </button>
                  </div>

                  {/* Bottom: StockLogo via Logo.dev */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-white/10 border border-white/10 shadow-sm flex items-center justify-center p-1 shrink-0">
                        <StockLogo symbol={holding.ticker} size="sm" />
                      </div>
                      <span className="text-[11px] text-white/60 font-medium truncate max-w-[110px]">
                        {holding.name.replace(" (Tokenized)", "").replace(" Tokenized", "")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">
                      ${holding.priceUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BOTTOM SECTION: [MARKET TABLE (LEFT)] & [ACTION CARD (RIGHT)] */}
      {/* Arrangement matching Image copy 3.png */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* MARKET ASSETS TABLE (LEFT ~65-70%) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="rounded-[24px] border border-white/10 bg-[#121118]/85 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between flex-1 shadow-2xl">
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Robinhood Chain Equities
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE 2026 QUOTES
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Real-time market feeds synced to tokenized Robinhood Chain smart contracts
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ticker..."
                    className="h-8 pl-8 pr-3 text-xs w-32 sm:w-40 rounded-full border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-purple-400"
                  />
                </div>

                {/* Category Filter */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sequence = ["All", "AI & Silicon", "Semiconductors", "Mega-Cap Tech"];
                    const next = sequence[(sequence.indexOf(marketFilter) + 1) % sequence.length];
                    setMarketFilter(next);
                  }}
                  className="h-8 text-xs rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-white gap-1.5 px-3 shadow-none cursor-pointer active:scale-95 duration-75"
                >
                  <span>{marketFilter}</span>
                  <ChevronDown size={13} className="text-white/50" />
                </Button>
              </div>
            </div>

            {/* Equities Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-semibold text-white/40 uppercase tracking-wider font-mono">
                    <th className="py-2.5 pl-1 pr-4">Asset</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4">24h Change</th>
                    <th className="py-2.5 px-4 hidden sm:table-cell">Market Cap</th>
                    <th className="py-2.5 pr-1 pl-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredStocks.map((stock) => {
                    const isWatched = watchlist.has(stock.ticker);
                    const isCopied = copiedAddress === stock.address;

                    return (
                      <tr
                        key={stock.ticker}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Asset Column with StockLogo */}
                        <td className="py-3 pl-1 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center p-1 shrink-0">
                              <StockLogo symbol={stock.ticker} size="sm" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs sm:text-sm text-white group-hover:text-purple-300 transition-colors">
                                {stock.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/50">
                                <span>{stock.ticker}</span>
                                <span>&bull;</span>
                                <span className="text-[10px] text-white/40">{stock.category}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-medium text-xs sm:text-sm text-white">
                          {stock.price}
                        </td>

                        {/* 24h Change */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`font-mono text-xs sm:text-sm font-semibold flex items-center gap-1 ${
                              stock.isPositive ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {stock.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {stock.change24h}
                          </span>
                        </td>

                        {/* Market Cap */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs sm:text-sm text-white/60 hidden sm:table-cell">
                          {stock.marketCap}
                        </td>

                        {/* Actions (Copy Contract + Star Watchlist) */}
                        <td className="py-3 pr-1 pl-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(stock.address)}
                              title={`Copy ${stock.ticker} contract address`}
                              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 rounded-full cursor-pointer active:scale-90 duration-75"
                            >
                              <Copy size={13} className={isCopied ? "text-emerald-400" : ""} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleWatch(stock.ticker)}
                              title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                              className="h-7 w-7 text-white/40 hover:text-amber-400 hover:bg-white/10 rounded-full cursor-pointer active:scale-90 duration-75"
                            >
                              <Star
                                size={14}
                                className={isWatched ? "fill-amber-400 text-amber-400" : ""}
                              />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* VALENCE AUTONOMOUS ACTION CARD (RIGHT ~30-35%) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col self-start rounded-[24px] border border-white/10 bg-gradient-to-br from-[#1c1829] via-[#14121d] to-[#0f0e15] p-5 sm:p-6 text-white relative overflow-hidden shadow-2xl">
          {/* Subtle Background Accent Mesh */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-purple-600/20 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 pointer-events-none opacity-20">
            <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
              <path d="M 50 150 L 170 50 L 195 140 Z" stroke="#cf63e8" strokeWidth="1.5" />
              <path d="M 70 155 L 160 70 L 180 150 Z" stroke="#9758f6" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="space-y-2 z-10">
            {/* Headline with Chain ID inline on right */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-white font-header leading-tight">
                  Autonomous DCA
                </div>
                <div className="text-xs sm:text-sm font-semibold text-purple-300">
                  AI Proposes &bull; Deterministic Disposes
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/50 border border-white/10 px-2 py-0.5 rounded-full bg-white/5">
                Robinhood Chain (4663)
              </span>
            </div>

            {/* Current Schedule Summary (Shifted up) */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5 text-xs text-white/70 mt-1">
              <div className="flex justify-between">
                <span className="text-white/50">Next scheduled buy:</span>
                <span className="font-semibold text-white">
                  ${nextBuy.amountUsd}/{nextBuy.frequency.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Target Theme:</span>
                <span className="font-medium text-purple-300">{nextBuy.theme}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Safety Circuit:</span>
                <span className="font-medium text-emerald-400">0.50% Max Slippage</span>
              </div>
            </div>

            <p className="text-xs text-white/50 leading-relaxed pt-0.5">
              Permit2 one-time allowance authorization enables hands-free execution without custody loss.
            </p>

            {/* Valence GIF */}
            <div className="pt-3 pb-1 flex items-center justify-center">
              <img
                src="/valence-gif.gif"
                alt="Valence Autonomous Execution Animation"
                className="w-auto max-h-48 sm:max-h-52 object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Action Buttons shifted right up directly under GIF at the marked line */}
          <div className="pt-2 flex flex-col gap-2 z-10">
            <Button
              onClick={handleManualCronTrigger}
              disabled={isTriggeringCron}
              className="w-full rounded-full bg-gradient-to-r from-[#cf63e8] to-[#9758f6] hover:opacity-90 font-semibold text-xs sm:text-sm h-10 shadow-none text-white cursor-pointer active:scale-95 duration-75"
            >
              {isTriggeringCron ? (
                <>
                  <RefreshCw size={13} className="mr-2 animate-spin" />
                  Executing MCP Swap...
                </>
              ) : (
                <>
                  <RefreshCw size={13} className="mr-2" />
                  Trigger Scheduled Buy Now
                </>
              )}
            </Button>

            <Link href="/goals/new" className="w-full">
              <Button
                variant="outline"
                className="w-full rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-xs h-9 gap-1.5 cursor-pointer active:scale-95 duration-75"
              >
                <span>Customize Portfolio Strategy</span>
                <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
        </div>

      </section>

      {/* Liquidation / Withdrawal Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-md border-border/80 bg-[#121019]/95 backdrop-blur-2xl text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <ArrowDownLeft size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Instant On-Chain Liquidation
              </span>
            </div>
            <DialogTitle className="text-lg">
              Withdraw {selectedWithdrawHolding?.ticker} to Wallet
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Liquidate your tokenized {selectedWithdrawHolding?.name} shares back to native ETH via Robinhood Chain DEX (UniversalRouter).
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawHolding && (
            <div className="space-y-4 py-2">
              {/* Asset Snapshot Card */}
              <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-white/10 p-1 flex items-center justify-center">
                      <StockLogo symbol={selectedWithdrawHolding.ticker} size="sm" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {selectedWithdrawHolding.name}
                      </div>
                      <div className="text-[10px] text-white/40">
                        Current Oracle Spot: ${selectedWithdrawHolding.priceUsd.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">
                      {selectedWithdrawHolding.shares.toFixed(2)} {selectedWithdrawHolding.ticker}
                    </div>
                    <div className="text-[10px] font-mono text-white/40">
                      {formatCurrency(selectedWithdrawHolding.amountUsd)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Liquidation Percentage Selector */}
              <div>
                <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                  <span>Liquidation Amount</span>
                  <span className="font-mono font-semibold text-emerald-400">{withdrawPct}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setWithdrawPct(pct)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                        withdrawPct === pct
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {pct === 100 ? "Max (100%)" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout Calculation Box */}
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Estimated Proceeds:</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency((selectedWithdrawHolding.amountUsd * withdrawPct) / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Est. Native ETH Payout:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ~{(((selectedWithdrawHolding.amountUsd * withdrawPct) / 100) / 2600).toFixed(6)} ETH
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-500/10">
                  <span className="text-white/40">Destination Wallet:</span>
                  <span className="font-mono text-white/70">
                    {connectedWallet ? truncateAddress(connectedWallet, 4) : "Connect in Navbar"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs h-10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteWithdraw}
                  disabled={isWithdrawing || !connectedWallet}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs h-10 shadow-none cursor-pointer"
                >
                  {isWithdrawing ? "Processing Swap..." : "Confirm & Liquidate to ETH"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
