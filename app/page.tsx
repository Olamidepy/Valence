"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Icon from "@/components/icon";
import { Search, Copy, ArrowRight } from "lucide-react";
import { StockLogo } from "@/components/stock-logo";
import { TOKENIZED_STOCKS } from "@/lib/tokenized-stocks";
import { Footer } from "@/components/footer";

interface SandboxGoal {
  prompt: string;
  theme: string;
  cadence: string;
  amount: number;
  reasoning: string;
  basket: Array<{
    symbol: string;
    name: string;
    weight: number;
    rationale: string;
    passed: boolean;
  }>;
}

const SAMPLE_GOALS: SandboxGoal[] = [
  {
    prompt: "$50/week into AI & semiconductors",
    theme: "AI & Semiconductors",
    cadence: "Weekly",
    amount: 50,
    reasoning:
      "Allocates to leading-edge contract foundry, GPU compute accelerators, and semiconductor ETF.",
    basket: [
      {
        symbol: "NVDA",
        name: "NVIDIA Corp",
        weight: 35,
        rationale: "Dominant AI accelerator platform; capped at 35% max limit.",
        passed: true,
      },
      {
        symbol: "TSM",
        name: "Taiwan Semiconductor",
        weight: 25,
        rationale: "Sole contract foundry for leading-edge node manufacturing.",
        passed: true,
      },
      {
        symbol: "AMD",
        name: "Advanced Micro Devices",
        weight: 20,
        rationale: "MI300 series compute competitor with strong datacenter growth.",
        passed: true,
      },
      {
        symbol: "SMH",
        name: "VanEck Semiconductor ETF",
        weight: 20,
        rationale: "Diversified semiconductor basket mitigating single-issuer risk.",
        passed: true,
      },
    ],
  },
  {
    prompt: "$200/month into Magnificent 7 mega-cap tech",
    theme: "Mega-Cap Tech",
    cadence: "Monthly",
    amount: 200,
    reasoning:
      "Focus on cash-flow generative enterprise tech giants with durable economic moats.",
    basket: [
      {
        symbol: "MSFT",
        name: "Microsoft Corp",
        weight: 30,
        rationale: "Enterprise cloud infrastructure and generative AI integration.",
        passed: true,
      },
      {
        symbol: "AAPL",
        name: "Apple Inc",
        weight: 25,
        rationale: "Installed hardware base and Apple Intelligence rollout.",
        passed: true,
      },
      {
        symbol: "NVDA",
        name: "NVIDIA Corp",
        weight: 25,
        rationale: "Datacenter scale AI hardware baseline.",
        passed: true,
      },
      {
        symbol: "PLTR",
        name: "Palantir Technologies",
        weight: 20,
        rationale: "Enterprise ontology & defense AI contract expansion.",
        passed: true,
      },
    ],
  },
  {
    prompt: "$75 bi-weekly custom silicon & foundry leaders",
    theme: "Custom Silicon",
    cadence: "Bi-Weekly",
    amount: 75,
    reasoning:
      "Exposure to custom ASIC silicon accelerators and hyperscale datacenter networking.",
    basket: [
      {
        symbol: "AVGO",
        name: "Broadcom Inc",
        weight: 35,
        rationale: "Custom TPU silicon partner for tier-1 hyperscalers.",
        passed: true,
      },
      {
        symbol: "TSM",
        name: "Taiwan Semiconductor",
        weight: 30,
        rationale: "Critical lithography manufacturer across all modern chipsets.",
        passed: true,
      },
      {
        symbol: "AMD",
        name: "Advanced Micro Devices",
        weight: 20,
        rationale: "High-bandwidth memory architectures and EPYC CPUs.",
        passed: true,
      },
      {
        symbol: "NVDA",
        name: "NVIDIA Corp",
        weight: 15,
        rationale: "Networking Quantum-2 InfiniBand systems.",
        passed: true,
      },
    ],
  },
  {
    prompt: "$100/month into high-dividend defensive equities",
    theme: "Defensive Dividend",
    cadence: "Monthly",
    amount: 100,
    reasoning:
      "Capital preservation with consistent yield and non-cyclical cash flow characteristics.",
    basket: [
      {
        symbol: "JNJ",
        name: "Johnson & Johnson",
        weight: 30,
        rationale: "60+ years consecutive dividend increases and healthcare stability.",
        passed: true,
      },
      {
        symbol: "PG",
        name: "Procter & Gamble",
        weight: 25,
        rationale: "Essential consumer staples with pricing power.",
        passed: true,
      },
      {
        symbol: "KO",
        name: "Coca-Cola Co",
        weight: 25,
        rationale: "Global distribution footprint and inflation-hedged dividend yield.",
        passed: true,
      },
      {
        symbol: "SCHD",
        name: "Schwab US Dividend ETF",
        weight: 20,
        rationale: "Broad index of high-dividend quality US equities.",
        passed: true,
      },
    ],
  },
];

const TOKENIZED_REGISTRY = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corp Tokenized",
    address: "0x111100002222000033330000444400005555NVD1",
    price: "$128.40",
    change24h: "+2.4%",
    category: "AI & Silicon",
    oracle: "Chainlink (NVDA/USD)",
    poolDepth: "$1,450,000",
    maxWeight: "35%",
  },
  {
    symbol: "TSM",
    name: "Taiwan Semiconductor Tokenized",
    address: "0x222200003333000044440000555500006666TSM2",
    price: "$174.20",
    change24h: "+1.8%",
    category: "Semiconductors",
    oracle: "Chainlink (TSM/USD)",
    poolDepth: "$890,000",
    maxWeight: "35%",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices Tokenized",
    address: "0x333300004444000055550000666600007777AMD3",
    price: "$156.80",
    change24h: "+0.9%",
    category: "Semiconductors",
    oracle: "Chainlink (AMD/USD)",
    poolDepth: "$620,000",
    maxWeight: "35%",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp Tokenized",
    address: "0x444400005555000066660000777700008888MSF4",
    price: "$448.90",
    change24h: "+0.4%",
    category: "Mega-Cap Tech",
    oracle: "Chainlink (MSFT/USD)",
    poolDepth: "$1,980,000",
    maxWeight: "35%",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc Tokenized",
    address: "0x555500006666000077770000888800009999AAP5",
    price: "$226.50",
    change24h: "+1.2%",
    category: "Mega-Cap Tech",
    oracle: "Chainlink (AAPL/USD)",
    poolDepth: "$2,400,000",
    maxWeight: "35%",
  },
  {
    symbol: "SMH",
    name: "VanEck Semiconductor ETF Tokenized",
    address: "0x66660000777700008888000099990000AAAA0SMH6",
    price: "$264.10",
    change24h: "+1.5%",
    category: "ETFs",
    oracle: "Chainlink (SMH/USD)",
    poolDepth: "$540,000",
    maxWeight: "35%",
  },
  {
    symbol: "AVGO",
    name: "Broadcom Inc Tokenized",
    address: "0x777700008888000099990000AAAA0000BBBBAVG7",
    price: "$168.30",
    change24h: "+3.1%",
    category: "AI & Silicon",
    oracle: "Chainlink (AVGO/USD)",
    poolDepth: "$430,000",
    maxWeight: "35%",
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies Tokenized",
    address: "0x8888000099990000AAAA0000BBBB0000CCCCPLT8",
    price: "$32.40",
    change24h: "-0.6%",
    category: "AI Software",
    oracle: "Chainlink (PLTR/USD)",
    poolDepth: "$310,000",
    maxWeight: "35%",
  },
];

const LIVE_AUDIT_LOG = [
  {
    id: "tx-9481",
    time: "2 mins ago",
    type: "ORDER_EXECUTED",
    status: "CONFIRMED",
    badgeVariant: "secondary",
    description: "BUY 0.389 NVDA &bull; tx 0x7fa2...9b14",
    detail: "Permit2 gasless swap &bull; Fee: $0.25 (50 bps) &bull; Slippage: 8 bps (limit: 50 bps)",
  },
  {
    id: "tx-9480",
    time: "5 mins ago",
    type: "GUARDRAIL_TRIMMED",
    status: "ENFORCED",
    badgeVariant: "secondary",
    description: "NVDA proposed weight 44% trimmed to 35% cap",
    detail: "Deterministic Gate: Rule 1 (MAX_HOLDING_WEIGHT_CAP) triggered &bull; 9% redistributed to TSM",
  },
  {
    id: "tx-9479",
    time: "12 mins ago",
    type: "ORACLE_VERIFIED",
    status: "PASSED",
    badgeVariant: "secondary",
    description: "Chainlink Price Oracle divergence check for TSM/USD",
    detail: "Pool price $174.20 vs Oracle $174.15 (diff: 2.8 bps, tolerance: ≤ 100 bps) &bull; Check Passed",
  },
  {
    id: "tx-9478",
    time: "18 mins ago",
    type: "ONCHAIN_LOGGED",
    status: "CONFIRMED",
    badgeVariant: "secondary",
    description: "Transaction finalized on Robinhood Chain L2",
    detail: "Automated rebalance completed for portfolio #104 • $50.00 USDC deployed",
  },
  {
    id: "tx-9477",
    time: "26 mins ago",
    type: "LIQUIDITY_AUDIT",
    status: "PASSED",
    badgeVariant: "secondary",
    description: "Uniswap V3 Pool Liquidity verified for MSFT/USDC",
    detail: "Available tick liquidity: $1,980,000 &bull; Exceeds $50,000 protocol liquidity floor",
  },
];

export default function DocumentationLandingPage() {
  const [activeSandboxIdx, setActiveSandboxIdx] = useState<number>(0);
  const [registryFilter, setRegistryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const selectedSandbox = SAMPLE_GOALS[activeSandboxIdx];

  const filteredRegistry = TOKENIZED_STOCKS.filter((item) => {
    const matchesFilter =
      registryFilter === "All" ||
      (registryFilter === "Semiconductors"
        ? item.category.includes("Silicon") || item.category.includes("Semiconductors")
        : item.category === registryFilter);
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const copyToClipboard = (address: string) => {
    navigator.clipboard?.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. HERO SECTION - 3D GRAPHIC APPLIED EXCLUSIVELY HERE */}
      <section className="relative isolate overflow-hidden -mt-[4.25rem] pt-28 pb-20 sm:pt-32 sm:pb-28 border-b border-border">
        {/* Hero Background using Background.png - fits overall hero */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: "url('/images/Background.png')" }}
        />
        {/* Clean subtle top and bottom gradient masks for contrast and seamless transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background/90 pointer-events-none z-[1]" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 text-center">

          {/* Hero Title */}
          <h1 className="font-hero text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Automated investing you can actually audit.
          </h1>

          {/* Hero Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every trade Valence makes passes a hard risk check before it touches your money,
            and every buy, block, and reason is logged where you can see it.
          </p>

          {/* Hero Action Buttons - Clean & minimal, no glow */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth">
              <button className="btn-hero-gradient px-7 py-3 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                <span>Launch App</span>
                <span className="text-base leading-none">↗</span>
              </button>
            </Link>

            <a href="#architecture">
              <button className="rounded-full px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-medium text-sm transition-colors cursor-pointer">
                Explore Architecture ↓
              </button>
            </a>
          </div>

          {/* Live Protocol Metric Ribbon - Strictly minimal shadcn Cards */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <Card className="border-border bg-card/90">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold font-mono text-foreground">4 / 4</div>
                <div className="text-xs text-muted-foreground mt-1">Deterministic Gate Checks</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/90">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold font-mono text-foreground">0 bps</div>
                <div className="text-xs text-muted-foreground mt-1">Slippage Tolerance Violations</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/90">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold font-mono text-foreground">100%</div>
                <div className="text-xs text-muted-foreground mt-1">Cryptographic Audit Trails</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/90">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold font-mono text-foreground">$50k+</div>
                <div className="text-xs text-muted-foreground mt-1">Pool Liquidity Depth Floor</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 2. NON-STOP TRANSLATIONAL MOTION BANNER - DROPPED DOWN WITH MARGIN */}
      <section className="relative w-full overflow-hidden border-y border-border bg-card/40 py-5 sm:py-6 my-10 sm:my-14">
        {/* Subtle edge fade overlays for seamless entrance and exit */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-32 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Continuous Translational Motion Marquee Track */}
        <div className="flex w-max animate-marquee items-center gap-20 sm:gap-28 md:gap-36">
          {/* First loop set */}
          {[0, 1, 2, 3].map((idx) => (
            <React.Fragment key={`banner-set1-${idx}`}>
              <div className="flex items-center shrink-0">
                <img
                  src="/robinhood-logo.png"
                  alt="Robinhood"
                  className="h-6 sm:h-7 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center shrink-0">
                <img
                  src="/circular-logo.png"
                  alt="Robinhood Chain"
                  className="h-7 sm:h-8 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity"
                />
              </div>
            </React.Fragment>
          ))}

          {/* Second identical loop set for seamless infinite transition */}
          {[0, 1, 2, 3].map((idx) => (
            <React.Fragment key={`banner-set2-${idx}`}>
              <div className="flex items-center shrink-0">
                <img
                  src="/robinhood-logo.png"
                  alt="Robinhood"
                  className="h-6 sm:h-7 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center shrink-0">
                <img
                  src="/circular-logo.png"
                  alt="Robinhood Chain"
                  className="h-7 sm:h-8 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity"
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 3. EXECUTION LIFECYCLE (THE 4 PILLARS) - STRICTLY SHADCN CARD */}
      <section id="architecture" className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {/* Thin rectangle in brand pinkish purple */}
          <div className="h-1 w-10 bg-[#ef4bac] rounded-full mx-auto mb-4" />
          <h2 className="font-header text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            How Valence Executes Your Intent
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            From plain-English investment goals to atomic on-chain execution on Robinhood Chain L2.
            AI reasoning is strictly separated from fund custody and risk assertions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 01 */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="h-8 w-8 rounded-md bg-secondary border border-border flex items-center justify-center font-mono font-bold text-xs text-foreground">
                  01
                </span>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  SERV AI
                </span>
              </div>
              <CardTitle className="text-base">Natural Language Goal</CardTitle>
              <CardDescription className="text-xs">
                Investors express investment goals in plain English. SERV AI analyzes thematic trends, searches the verified token registry, and proposes target portfolio weights.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-muted-foreground">
              <div className="rounded bg-secondary p-2.5 font-mono text-[11px] border border-border">
                &ldquo;$50/wk into AI hardware &amp; foundries&rdquo;
              </div>
            </CardContent>
          </Card>

          {/* Step 02 */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="h-8 w-8 rounded-md bg-secondary border border-border flex items-center justify-center font-mono font-bold text-xs text-foreground">
                  02
                </span>
                <span className="text-[10px] font-mono uppercase text-emerald-400">
                  GUARDRAIL
                </span>
              </div>
              <CardTitle className="text-base">Deterministic Pre-Trade Gate</CardTitle>
              <CardDescription className="text-xs">
                Pure mathematical code evaluates the proposal: single asset cap (&le; 35%), max slippage (&le; 50 bps), Chainlink oracle price parity, and pool liquidity floor.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-muted-foreground">
              <div className="rounded bg-secondary p-2.5 font-mono text-[11px] border border-border text-emerald-400">
                assert(weight &le; 35% &amp;&amp; slip &le; 50bps)
              </div>
            </CardContent>
          </Card>

          {/* Step 03 */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="h-8 w-8 rounded-md bg-secondary border border-border flex items-center justify-center font-mono font-bold text-xs text-foreground">
                  03
                </span>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  ON-CHAIN L2
                </span>
              </div>
              <CardTitle className="text-base">Permit2 &amp; Uniswap V3</CardTitle>
              <CardDescription className="text-xs">
                Orders that pass deterministic validation execute via Permit2 gasless signatures and Uniswap V3 concentrated liquidity pools with tight slippage ticks.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-muted-foreground">
              <div className="rounded bg-secondary p-2.5 font-mono text-[11px] border border-border">
                Permit2.permitTransferFrom() &bull; MEV Guard
              </div>
            </CardContent>
          </Card>

          {/* Step 04 */}
          <Card className="border-border bg-card">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="h-8 w-8 rounded-md bg-secondary border border-border flex items-center justify-center font-mono font-bold text-xs text-foreground">
                  04
                </span>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  VERIFICATION
                </span>
              </div>
              <CardTitle className="text-base">Immutable Audit &amp; Ledger</CardTitle>
              <CardDescription className="text-xs">
                Every trade confirmation, holding trim, and rule block writes permanently to the public ledger with verifiable transaction hashes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-muted-foreground">
              <div className="rounded bg-secondary p-2.5 font-mono text-[11px] border border-border">
                tx 0x7fa2...9b14 &bull; On-chain confirmed
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. INTERACTIVE REASONING & GUARDRAILS SIMULATOR - STRICTLY SHADCN CARD */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <Card className="border-border bg-card">
          <CardHeader className="p-6 sm:p-8 border-b border-border">
            <div>
              {/* Thin rectangle in brand pinkish purple */}
              <div className="h-1 w-8 bg-[#ef4bac] rounded-full mb-3" />
              <CardTitle className="text-2xl font-bold">
                Test the Reasoning &amp; Guardrail Pipeline
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Choose an investment prompt below to see how SERV proposes target allocations and how deterministic guardrails validate each asset.
              </CardDescription>
            </div>

            {/* Prompt Selector Tabs */}
            <div className="pt-6">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3 font-mono">
                Select Objective Preset:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {SAMPLE_GOALS.map((goal, idx) => (
                  <button
                    key={goal.prompt}
                    onClick={() => setActiveSandboxIdx(idx)}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer text-xs ${
                      activeSandboxIdx === idx
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="text-foreground">{goal.theme}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{goal.cadence}</span>
                    </div>
                    <div className="text-[11px] truncate">&ldquo;{goal.prompt}&rdquo;</div>
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-border text-xs">
              <div>
                <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Audit Verdict: 4/4 Checks Passed
                </span>
                <p className="text-muted-foreground mt-0.5">
                  AI Proposed Rationale: {selectedSandbox.reasoning}
                </p>
              </div>
              <div className="text-left sm:text-right font-mono">
                <span className="text-muted-foreground">Cadence Target: </span>
                <strong className="text-foreground">${selectedSandbox.amount} USDC / {selectedSandbox.cadence}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium">Symbol</th>
                    <th className="pb-3 font-medium">Target Weight</th>
                    <th className="pb-3 font-medium">Guardrail Audit</th>
                    <th className="pb-3 font-medium">Proposed Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selectedSandbox.basket.map((item) => (
                    <tr key={item.symbol} className="hover:bg-secondary/50">
                      <td className="py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          <StockLogo symbol={item.symbol} name={item.name} size="xs" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-semibold text-foreground">{item.symbol}</td>
                      <td className="py-3 font-mono font-semibold text-foreground">{item.weight}%</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Passed (&le; 35%)
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{item.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. DETERMINISTIC GUARDRAILS MATRIX (DEEP DIVE) - STRICTLY SHADCN CARD */}
      <section id="guardrails" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {/* Thin rectangle in brand pinkish purple */}
          <div className="h-1 w-10 bg-[#ef4bac] rounded-full mx-auto mb-4" />
          <h2 className="font-header text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            The Deterministic Guardrail Matrix
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Code runs prior to every single swap on Robinhood Chain L2. The AI has zero authority to bypass these 4 mathematical invariants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule 1 */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">RULE 1</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  CAP &le; 35%
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">Max Holding Weight Constraint</CardTitle>
              <CardDescription className="text-xs">
                Guarantees non-concentrated portfolio risk across uncorrelated tokenized equities. Any asset proposed above 35% is automatically trimmed down, and excess is redistributed.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs font-mono bg-secondary p-3 rounded-md border border-border mx-6 mb-6 text-muted-foreground">
              <code>if (asset.weight &gt; 35.0) {"{"} asset.weight = 35.0; wasTrimmed = true; {"}"}</code>
            </CardContent>
          </Card>

          {/* Rule 2 */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">RULE 2</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  SLIP &le; 50 BPS
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">Strict Slippage Tolerance Limit</CardTitle>
              <CardDescription className="text-xs">
                Hard caps the maximum acceptable price impact during Robinhood Chain pool swaps. Rejects execution if current market depth causes higher slippage than 0.50%.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs font-mono bg-secondary p-3 rounded-md border border-border mx-6 mb-6 text-muted-foreground">
              <code>if (order.slippageBps &gt; 50) {"{"} revert(&quot;MAX_SLIPPAGE_BREACH: &gt; 50 bps&quot;); {"}"}</code>
            </CardContent>
          </Card>

          {/* Rule 3 */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">RULE 3</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  ORACLE DEV &le; 100 BPS
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">Chainlink Price Oracle Validation</CardTitle>
              <CardDescription className="text-xs">
                Rejects trades if pool spot price deviates by more than 1.00% from real-world Chainlink decentralized feeds, guarding against flash-loan and pool manipulation.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs font-mono bg-secondary p-3 rounded-md border border-border mx-6 mb-6 text-muted-foreground">
              <code>if (abs(spotPrice - oraclePrice) / oraclePrice * 10000 &gt; 100) revert(&quot;ORACLE_DISLOCATION&quot;);</code>
            </CardContent>
          </Card>

          {/* Rule 4 */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">RULE 4</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  LIQ &ge; $50,000
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">Minimum Pool Liquidity Depth Floor</CardTitle>
              <CardDescription className="text-xs">
                Blocks trade execution on thin or newly created illiquid token pools on Robinhood Chain L2. Only tokenized equities with deep institutional reserves can be bought.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs font-mono bg-secondary p-3 rounded-md border border-border mx-6 mb-6 text-muted-foreground">
              <code>if (pool.totalLiquidityUsd &lt; 50000) {"{"} revert(&quot;INSUFFICIENT_POOL_LIQUIDITY_FLOOR&quot;); {"}"}</code>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. VERIFIED TOKENIZED EQUITIES REGISTRY ON ROBINHOOD CHAIN - STRICTLY SHADCN CARD */}
      <section id="registry" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            {/* Thin rectangle in brand pinkish purple */}
            <div className="h-1 w-8 bg-[#ef4bac] rounded-full mb-3" />
            <h2 className="font-header text-3xl font-bold tracking-tight text-foreground">
              Verified Tokenized Equities on Robinhood Chain
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
              Valence trades exclusively against verified ERC-20 tokenized equity contracts with live Chainlink price feeds and deep liquidity on Robinhood Chain L2.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search ticker or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs bg-secondary/60 border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono mb-8">
          {["All", "AI & Silicon", "Mega-Cap Tech", "Semiconductors", "ETFs", "Defensive Yield"].map((category) => (
            <button
              key={category}
              onClick={() => setRegistryFilter(category)}
              className={`px-3 py-1 rounded-md border transition-colors cursor-pointer ${
                registryFilter === category
                  ? "border-primary bg-primary/10 text-foreground font-semibold"
                  : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {category}
            </button>
          ))}
          <span className="text-[11px] text-muted-foreground ml-auto hidden sm:inline font-mono">
            Showing {filteredRegistry.length} verified assets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRegistry.map((stock) => (
            <Card key={stock.ticker} className="border-border bg-card hover:border-primary/40 transition-colors flex flex-col justify-between">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <StockLogo symbol={stock.ticker} name={stock.name} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-base text-foreground leading-none">{stock.ticker}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono uppercase bg-secondary/50 text-muted-foreground border-border">
                          ERC-20
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate max-w-[130px]" title={stock.name}>
                        {stock.name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={stock.isPositive ? "default" : "destructive"} className="text-[10px] font-mono shrink-0 py-0.5 px-1.5">
                    {stock.change24h}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 text-[11px] space-y-2 text-muted-foreground flex-1">
                {/* Price Display */}
                <div className="bg-secondary/50 rounded-lg p-2.5 border border-border flex items-baseline justify-between">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Spot Price</span>
                  <span className="text-lg font-mono font-bold text-foreground">{stock.price}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-mono text-foreground font-medium text-[10px]">{stock.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Chainlink Oracle:</span>
                    <span className="font-mono text-emerald-400 text-[10px] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Feed
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pool Liquidity:</span>
                    <span className="font-mono text-foreground font-medium text-[10px]">{stock.poolDepth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Guardrail Cap:</span>
                    <span className="font-mono text-zinc-300 text-[10px]">&le; 35% Max Weight</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/60">
                  <span className="text-[10px]">Contract:</span>
                  <button
                    onClick={() => copyToClipboard(stock.address)}
                    className="font-mono text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                    title="Click to copy contract address"
                  >
                    <span>{stock.address.slice(0, 6)}...{stock.address.slice(-4)}</span>
                    <Copy size={12} />
                    {copiedAddress === stock.address && (
                      <span className="text-emerald-400 font-bold ml-1 text-[9px]">Copied!</span>
                    )}
                  </button>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Link href={`/goals/new?ticker=${stock.ticker}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 border-border bg-secondary/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40">
                    <span>Allocate in Goal</span>
                    <ArrowRight size={14} className="text-primary font-bold" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. LIVE PUBLIC AUDIT FEED / ON-CHAIN TERMINAL - STRICTLY SHADCN CARD */}
      <section id="audit" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            {/* Thin rectangle in brand pinkish purple */}
            <div className="h-1 w-8 bg-[#ef4bac] rounded-full mb-4" />
            <h2 className="font-header text-3xl font-bold tracking-tight text-foreground">
              Zero Silent Discards. Complete Verifiability.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed">
              When an order executes, you receive an on-chain transaction hash and immediate ledger confirmation.
              When an order is trimmed or blocked by deterministic gates, the full mathematical trigger is indelibly logged.
            </p>

            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Deterministic pre-trade verification</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Cryptographic Permit2 signatures</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Real-time public audit ledger with every rebalance</span>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/activity">
                <button className="rounded-full px-5 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-medium transition-colors cursor-pointer">
                  View Full Audit Log &rarr;
                </button>
              </Link>
            </div>
          </div>

          {/* Audit Terminal Card */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-foreground">
                    ROBINHOOD CHAIN L2 AUDIT DISPATCH
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  LIVE STREAM
                </span>
              </CardHeader>
              <CardContent className="p-4 font-mono text-xs space-y-3">
                {LIVE_AUDIT_LOG.map((item) => (
                  <div key={item.id} className="p-3 rounded-md bg-secondary/70 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                          {item.status}
                        </span>
                        <span className="text-foreground font-semibold">{item.description}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px]">{item.time}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pl-0.5">
                      {item.detail}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. COMPARISON MATRIX: WHY VALENCE WINS - STRICTLY SHADCN CARD */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {/* Thin rectangle in brand pinkish purple */}
          <div className="h-1 w-10 bg-[#ef4bac] rounded-full mx-auto mb-4" />
          <h2 className="font-header text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Why Deterministic Guardrails Beat Black-Box Bots
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Most automated trading bots leave risk assertions to the AI itself. Valence separates reasoning from execution with mathematical code.
          </p>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left bg-secondary/50">
                  <th className="p-4 font-medium text-foreground">Capability</th>
                  <th className="p-4 font-medium text-foreground">Valence Protocol</th>
                  <th className="p-4 font-medium text-muted-foreground">Typical Black-Box AI Bots</th>
                  <th className="p-4 font-medium text-muted-foreground">Manual Broker Trading</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 font-medium text-foreground">Fund Custody</td>
                  <td className="p-4 text-emerald-400 font-semibold">100% Non-Custodial (Permit2)</td>
                  <td className="p-4 text-rose-400">Custodial API keys stored in cloud</td>
                  <td className="p-4 text-muted-foreground">Centralized broker holding</td>
                </tr>
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 font-medium text-foreground">Pre-Trade Risk Gates</td>
                  <td className="p-4 text-emerald-400 font-semibold">Deterministic smart contract checks</td>
                  <td className="p-4 text-rose-400">None (AI hallucinates risk parameters)</td>
                  <td className="p-4 text-muted-foreground">Manual self-discipline</td>
                </tr>
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 font-medium text-foreground">Slippage &amp; MEV Guard</td>
                  <td className="p-4 text-emerald-400 font-semibold">Hard 50 bps cap &amp; private mempool</td>
                  <td className="p-4 text-rose-400">Susceptible to sandwich attacks</td>
                  <td className="p-4 text-muted-foreground">Payment for Order Flow (PFOF)</td>
                </tr>
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 font-medium text-foreground">Oracle Verification</td>
                  <td className="p-4 text-emerald-400 font-semibold">Chainlink feeds (&le; 100 bps parity)</td>
                  <td className="p-4 text-rose-400">Unverified exchange API feeds</td>
                  <td className="p-4 text-muted-foreground">Internal broker quotes</td>
                </tr>
                <tr className="hover:bg-secondary/30">
                  <td className="p-4 font-medium text-foreground">Real-time Push Alerts</td>
                  <td className="p-4 text-emerald-400 font-semibold">Instant on-chain confirmation on event</td>
                  <td className="p-4 text-muted-foreground">Delayed email digest</td>
                  <td className="p-4 text-muted-foreground">Broker notifications</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 9. DEVELOPER & CONTRACT ARCHITECTURE - STRICTLY SHADCN CARD */}
      <section id="docs" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {/* Thin rectangle in brand pinkish purple */}
          <div className="h-1 w-10 bg-[#ef4bac] rounded-full mx-auto mb-4" />
          <h2 className="font-header text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Smart Contract Architecture
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Build on top of Valence. Integrate automated goal-based investing into any Robinhood Chain L2 decentralized application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contracts Spec Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Robinhood Chain L2 Deployment</CardTitle>
              <CardDescription className="text-xs">
                Official contract interfaces deployed on Robinhood Chain Arbitrum Orbit rollup.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 font-mono text-xs space-y-2.5 text-muted-foreground">
              <div className="p-2.5 rounded bg-secondary border border-border flex justify-between items-center">
                <span>GuardrailRegistry.sol:</span>
                <span className="text-foreground font-semibold">0x892a...c014</span>
              </div>
              <div className="p-2.5 rounded bg-secondary border border-border flex justify-between items-center">
                <span>ValenceVault.sol:</span>
                <span className="text-foreground font-semibold">0x41f3...92a1</span>
              </div>
              <div className="p-2.5 rounded bg-secondary border border-border flex justify-between items-center">
                <span>Permit2Router.sol:</span>
                <span className="text-foreground font-semibold">0x0000...0002</span>
              </div>
              <div className="p-2.5 rounded bg-secondary border border-border flex justify-between items-center">
                <span>ChainlinkRegistry:</span>
                <span className="text-foreground font-semibold">0x14e0...b821</span>
              </div>
            </CardContent>
          </Card>

          {/* SDK Integration Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">SDK Quickstart</CardTitle>
              <CardDescription className="text-xs">
                Instantiate client and simulate guardrails in under 5 lines of code.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 font-mono text-xs text-muted-foreground">
              <div className="p-3 rounded bg-secondary border border-border space-y-1">
                <div className="text-zinc-500">// 1. Install SDK</div>
                <div className="text-foreground">npm install @valence/sdk viem</div>
                <div className="text-zinc-500 pt-2">// 2. Evaluate intent against guardrail matrix</div>
                <div className="text-foreground">const client = new ValenceClient({"{"} chainId: 84532 {"}"});</div>
                <div className="text-foreground">const audit = await client.guardrails.verify(proposal);</div>
                <div className="text-emerald-400">console.log(audit.passed); // true</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS (FAQ) - STRICTLY SHADCN CARD */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-14">
          {/* Thin rectangle in brand pinkish purple */}
          <div className="h-1 w-10 bg-[#ef4bac] rounded-full mx-auto mb-4" />
          <h2 className="font-header text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Everything you need to know about custody, risk controls, and automated trading on Robinhood Chain L2.
          </p>
        </div>

        <div className="space-y-3">
          <Card className="border-border bg-card">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-bold">Does Valence ever hold or take custody of my funds?</CardTitle>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                No. Valence is completely non-custodial. All operations use Uniswap Labs&apos; Permit2 standard. Your assets remain in your own wallet until the exact second an automated trade executes through decentralized liquidity pools. You can revoke authorization at any time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-bold">What happens if the AI proposes an asset that breaches risk rules?</CardTitle>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                The deterministic gate intercepts the proposal before any swap occurs. If an asset exceeds the 35% concentration cap, it is automatically trimmed down, and the excess is re-allocated across diversified holdings. If slippage or oracle deviation is too high, the trade is rejected entirely.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-bold">How are tokenized stocks priced and settled?</CardTitle>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                Tokenized stocks are verified ERC-20 smart contracts deployed on Robinhood Chain L2. Real-time prices are continually validated using Chainlink decentralized oracle networks, ensuring pool pricing never deviates from underlying US stock markets.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-bold">What protocol fees are charged?</CardTitle>
              <CardDescription className="text-xs mt-1 leading-relaxed">
                Valence charges a transparent 0.50% (50 bps) protocol fee only on successfully executed rebalance trades. Idle capital, wallet connections, and guardrail validations incur zero protocol fees.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* 11. FINAL PROTOCOL CALL TO ACTION - Launch App button removed from foot */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center border-t border-border">
        {/* Thin rectangle in brand pinkish purple */}
        <div className="h-1 w-10 bg-[#ef4bac] rounded-full mx-auto mb-4" />
        <h2 className="font-header text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Ready to automate your tokenized equity portfolio?
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Connect your Robinhood Chain wallet, set your cadence and themes in natural language, and let deterministic code safeguard your wealth.
        </p>
      </section>

      {/* 12. FULL-SCALE INSTITUTIONAL BLOCKCHAIN FOOTER */}
      <Footer />
    </div>
  );
}
