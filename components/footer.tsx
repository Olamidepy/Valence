import React from "react";
import Link from "next/link";
import { ValenceLogo } from "@/components/valence-logo";
import { BrandLogo, GitHubIcon, XIcon } from "@/components/brand-logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-[#0a090d] text-foreground">
      {/* Main Multi-Column Links Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 gap-y-10">
          {/* Brand Info & Mission Statement (2 cols) */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block hover:opacity-95 transition-opacity">
              <ValenceLogo size={22} />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              The institutional-grade, zero-trust automated portfolio protocol for tokenized equities on Robinhood Chain L2. AI proposes, deterministic code disposes.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-md border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-zinc-600 transition-colors p-1.5"
                title="GitHub"
              >
                <BrandLogo
                  domain="github.com"
                  name="GitHub"
                  className="h-4 w-4"
                  fallbackIcon={<GitHubIcon className="h-4 w-4" />}
                />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-md border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-zinc-600 transition-colors p-1.5"
                title="X"
              >
                <BrandLogo
                  domain="x.com"
                  name="X"
                  className="h-3.5 w-3.5"
                  fallbackIcon={<XIcon className="h-3.5 w-3.5" />}
                />
              </a>
            </div>
          </div>

          {/* Col 1: Protocol & App */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Protocol
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/auth" className="hover:text-foreground transition-colors">
                  Trading Terminal
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Portfolio Dashboard
                </Link>
              </li>
              <li>
                <Link href="/goals/new" className="hover:text-foreground transition-colors">
                  Create Strategy Goal
                </Link>
              </li>
              <li>
                <Link href="/#guardrails" className="hover:text-foreground transition-colors">
                  Guardrail Matrix
                </Link>
              </li>
              <li>
                <Link href="/#registry" className="hover:text-foreground transition-colors">
                  Tokenized Asset Registry
                </Link>
              </li>
              <li>
                <Link href="/activity" className="hover:text-foreground transition-colors">
                  Public Audit Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Architecture & Devs */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Developers
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/#architecture" className="hover:text-foreground transition-colors">
                  Architecture Overview
                </Link>
              </li>
              <li>
                <a href="#contracts" className="hover:text-foreground transition-colors">
                  Smart Contracts
                </a>
              </li>
              <li>
                <a href="#sdk" className="hover:text-foreground transition-colors">
                  SDK Documentation
                </a>
              </li>
              <li>
                <a href="#permit2" className="hover:text-foreground transition-colors">
                  Permit2 Gasless Swaps
                </a>
              </li>
              <li>
                <a href="#oracles" className="hover:text-foreground transition-colors">
                  Chainlink Price Oracles
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground transition-colors">
                  Fee Distribution Contract
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Security & Risk */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Security
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#security" className="hover:text-foreground transition-colors">
                  Deterministic Invariants
                </a>
              </li>
              <li>
                <a href="#audits" className="hover:text-foreground transition-colors">
                  Formal Verification
                </a>
              </li>
              <li>
                <a href="#slippage" className="hover:text-foreground transition-colors">
                  50 bps Slippage Bound
                </a>
              </li>
              <li>
                <a href="#cap" className="hover:text-foreground transition-colors">
                  35% Asset Concentration Cap
                </a>
              </li>
              <li>
                <a href="#bugbounty" className="hover:text-foreground transition-colors">
                  Bug Bounty ($250,000)
                </a>
              </li>
              <li>
                <a href="#status" className="hover:text-foreground transition-colors">
                  Uptime &amp; Incident Log
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Governance &amp; Info
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#whitepaper" className="hover:text-foreground transition-colors">
                  Technical Whitepaper
                </a>
              </li>
              <li>
                <a href="#tokenomics" className="hover:text-foreground transition-colors">
                  Protocol Fee Economics
                </a>
              </li>
              <li>
                <a href="#compliance" className="hover:text-foreground transition-colors">
                  Tokenized Equities Compliance
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-foreground transition-colors">
                  Terms of Protocol Use
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <Link href="/settings/alerts" className="hover:text-foreground transition-colors">
                  Telegram Bot Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimers & Copyright Area */}
      <div className="border-t border-border bg-black/40 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-[11px] text-muted-foreground/80 leading-relaxed">
            <p>
              <strong>Non-Custodial Protocol Notice:</strong> Valence is an autonomous smart contract infrastructure operating on Robinhood Chain L2. Valence never takes custody of, manages, or holds investor funds. All rebalancing operations are signed via Permit2 cryptographic authorizations and executed through decentralized liquidity pools.
            </p>
            <p>
              <strong>Synthetic &amp; Tokenized Equities:</strong> Tokenized equities referenced on this platform represent decentralized synthetic or tokenized contracts deployed on Robinhood Chain with prices verified by Chainlink decentralized oracle networks. This software is open-source and does not constitute financial, investment, or legal advice.
            </p>
          </div>

          <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              &copy; {new Date().getFullYear()} Valence Protocol. Built for Robinhood Chain L2. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Security Audited</span>
              <span>&bull;</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">OpenZeppelin Standard</span>
              <span>&bull;</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Chainlink Partner</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
