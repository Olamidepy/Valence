"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ValenceLogo } from "@/components/valence-logo";
import {
  Wallet,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Star,
  QrCode,
  Copy,
  ExternalLink,
  Loader2,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useInjectedWallets,
  switchToRobinhoodMainnet,
  setActiveProvider,
  clearActiveProvider,
  findMetaMaskProvider,
  EIP6963ProviderDetail,
} from "@/lib/chain/wallet-discovery";

export default function AuthPage() {
  const router = useRouter();

  // Live EIP-6963 Injected Wallets Discovery (Zerion, MetaMask, Rabby, Coinbase, etc.)
  const detectedWallets = useInjectedWallets();

  // Wallet Connection State
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedWalletName, setSelectedWalletName] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);

  // WalletConnect Modal State
  const [showWalletConnectDialog, setShowWalletConnectDialog] = useState<boolean>(false);

  // Check localStorage / sessionStorage on mount
  React.useEffect(() => {
    try {
      const active = sessionStorage.getItem("valence_active_wallet") || localStorage.getItem("valence_connected_wallet");
      if (active) {
        setWalletAddress(active);
        setIsWalletConnected(true);
        setSelectedWalletName(sessionStorage.getItem("valence_active_wallet_name") || "MetaMask");
      }
    } catch (e) {
      console.warn("Could not check wallet state", e);
    }
  }, []);

  // Clean wallet disconnect handler
  const handleDisconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    setSelectedWalletName("");
    clearActiveProvider();
    try {
      sessionStorage.removeItem("valence_active_wallet");
      sessionStorage.removeItem("valence_active_wallet_name");
      localStorage.removeItem("valence_connected_wallet");
      localStorage.removeItem("walletconnect");
      if (typeof window !== "undefined") {
        delete (window as any).__valenceActiveWallet;
        delete (window as any).__valenceActiveWalletName;
        window.dispatchEvent(new CustomEvent("valence:wallet_disconnected"));
      }
    } catch {}
    toast.info("Wallet disconnected.");
  };

  // Logo.dev Helper for high-resolution brand logos
  const getWalletLogo = (name: string, icon?: string) => {
    if (icon && icon.startsWith("data:image")) return icon;
    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "pk_GyuktWeZTOaELO6mQpM8Xg";
    const lower = name.toLowerCase();
    let domain = "zerion.io";
    if (lower.includes("metamask")) domain = "metamask.io";
    else if (lower.includes("zerion")) domain = "zerion.io";
    else if (lower.includes("coinbase")) domain = "coinbase.com";
    else if (lower.includes("rabby")) domain = "rabby.io";
    else if (lower.includes("rainbow")) domain = "rainbow.me";
    else if (lower.includes("phantom")) domain = "phantom.app";
    else if (lower.includes("walletconnect")) domain = "walletconnect.com";
    return `https://img.logo.dev/${domain}?token=${token}&size=64`;
  };

  // Live Multi-Wallet Connection (Zerion, MetaMask, Rabby, etc. on Chain ID 4663)
  const handleConnectProvider = async (detail: EIP6963ProviderDetail) => {
    setIsConnectingWallet(true);
    setSelectedWalletName(detail.info.name);
    toast.info(`Connecting to ${detail.info.name} on Robinhood Chain Mainnet...`);

    try {
      const account = await switchToRobinhoodMainnet(detail.provider);

      setWalletAddress(account);
      setIsWalletConnected(true);
      setActiveProvider(detail.provider, detail.info.name);
      sessionStorage.setItem("valence_active_wallet", account);
      sessionStorage.setItem("valence_active_wallet_name", detail.info.name);
      localStorage.setItem("valence_connected_wallet", account);
      localStorage.setItem(
        "valence_user",
        JSON.stringify({
          walletAddress: account,
          walletType: detail.info.name,
          network: "Robinhood Chain Mainnet",
          chainId: 4663,
          authenticatedAt: new Date().toISOString(),
        })
      );

      if (typeof window !== "undefined") {
        (window as any).__valenceActiveWallet = account;
        (window as any).__valenceActiveWalletName = detail.info.name;
        window.dispatchEvent(
          new CustomEvent("valence:wallet_connected", {
            detail: { address: account, name: detail.info.name },
          })
        );
      }

      toast.success(`Connected ${account.slice(0, 6)}...${account.slice(-4)} via ${detail.info.name}!`);
    } catch (err: any) {
      console.error("Provider connect error:", err);
      const msg = err?.message || "";
      if (err?.code === 4001 || msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("cancelled")) {
        toast.info(`Connection was cancelled in ${detail.info.name}.`);
      } else if (msg.includes("already pending") || err?.code === -32002) {
        toast.warning(`A connection request is already pending in ${detail.info.name}. Please check your browser extension.`);
      } else {
        toast.error(msg || `Failed to connect with ${detail.info.name}`);
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Connect Generic Injected Wallet fallback (e.g. MetaMask / Zerion via window.ethereum)
  const handleConnectFallbackInjected = async (name: string) => {
    setIsConnectingWallet(true);
    setSelectedWalletName(name);

    if (typeof window !== "undefined") {
      const win = window as any;
      let targetProvider: any = null;

      if (name.toLowerCase().includes("metamask")) {
        targetProvider = findMetaMaskProvider();
      } else if (name.toLowerCase().includes("zerion")) {
        targetProvider = win.zerionWallet || (Array.isArray(win.ethereum?.providers) ? win.ethereum.providers.find((p: any) => p.isZerion) : null);
      }

      if (!targetProvider) {
        targetProvider = win.zerionWallet || win.ethereum;
      }

      if (targetProvider) {
        try {
          const account = await switchToRobinhoodMainnet(targetProvider);
          setWalletAddress(account);
          setIsWalletConnected(true);
          setActiveProvider(targetProvider, name);
          sessionStorage.setItem("valence_active_wallet", account);
          sessionStorage.setItem("valence_active_wallet_name", name);
          localStorage.setItem("valence_connected_wallet", account);
          localStorage.setItem(
            "valence_user",
            JSON.stringify({
              walletAddress: account,
              walletType: name,
              network: "Robinhood Chain Mainnet",
              chainId: 4663,
              authenticatedAt: new Date().toISOString(),
            })
          );

          win.__valenceActiveWallet = account;
          win.__valenceActiveWalletName = name;
          win.dispatchEvent(
            new CustomEvent("valence:wallet_connected", {
              detail: { address: account, name },
            })
          );

          toast.success(`Connected ${account.slice(0, 6)}...${account.slice(-4)} via ${name}!`);
          setIsConnectingWallet(false);
          return;
        } catch (err: any) {
          console.error("Direct fallback connect error:", err);
          const msg = err?.message || "";
          if (err?.code === 4001 || msg.toLowerCase().includes("user rejected")) {
            toast.info("Connection was cancelled.");
          } else {
            toast.error(msg || "Could not connect to wallet.");
          }
          setIsConnectingWallet(false);
          return;
        }
      }
    }

    toast.error("No Web3 wallet extension detected in browser.");
    setIsConnectingWallet(false);
  };

  // Complete Onboarding & Enter SERV Reasoning Dashboard
  const handleProceedToDashboard = () => {
    if (walletAddress) {
      sessionStorage.setItem("valence_active_wallet", walletAddress);
      sessionStorage.setItem("valence_active_wallet_name", selectedWalletName || "MetaMask");
      if (typeof window !== "undefined") {
        (window as any).__valenceActiveWallet = walletAddress;
        (window as any).__valenceActiveWalletName = selectedWalletName || "MetaMask";
        window.dispatchEvent(
          new CustomEvent("valence:wallet_connected", {
            detail: { address: walletAddress, name: selectedWalletName || "MetaMask" },
          })
        );
      }
    }
    toast.success("Robinhood Chain Mainnet active. Navigating to Dashboard...");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#09080c] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Outer Container */}
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0d0c12] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: Purple Glow Container with Onboarding Steps */}
        <div className="lg:col-span-6 relative overflow-hidden bg-gradient-to-b from-[#7c3aed]/25 via-[#191528] to-[#0e0d16] p-6 sm:p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
          {/* Radial Purple Lighting Aura */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[340px] bg-gradient-to-b from-fuchsia-500/40 via-purple-600/35 to-transparent blur-[85px] pointer-events-none rounded-full" />
          <div className="absolute top-1/3 left-10 w-48 h-48 bg-indigo-500/20 blur-[70px] pointer-events-none rounded-full" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 group hover:opacity-95 transition-opacity">
              <ValenceLogo size={24} />
            </Link>
          </div>

          {/* Center Content: Title & 3 Progress Step Cards */}
          <div className="relative z-10 my-auto py-8">
            <h2 className="font-header text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Connect Mainnet Wallet
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mb-8 max-w-sm">
              Connect your Web3 wallet to Robinhood Chain (4663) to authorize autonomous tokenized equity investing.
            </p>

            <div className="space-y-3 max-w-sm">
              {/* Step 1 Card: Connect Robinhood Chain */}
              <div className="rounded-2xl bg-white text-zinc-950 px-5 py-3.5 flex items-center gap-3.5 transition-all shadow-none">
                <div className="h-6 w-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                  {isWalletConnected ? <CheckCircle2 size={14} className="text-emerald-400" /> : "1"}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold block">
                    Connect Robinhood Chain
                  </span>
                  <span className="text-[10px] text-zinc-600 block">
                    {isWalletConnected
                      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} (Connected)`
                      : "Deterministic EVM Mainnet (4663)"}
                  </span>
                </div>
              </div>

              {/* Step 2 Card: Set up your guardrails */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white/80 px-5 py-3.5 flex items-center gap-3.5">
                <div className="h-6 w-6 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold font-mono">
                  2
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium block">
                    Set up your guardrails
                  </span>
                  <span className="text-[10px] text-white/40 block">
                    SERV AI Autonomous Allocation
                  </span>
                </div>
              </div>

              {/* Step 3 Card: Automate & Invest */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white/80 px-5 py-3.5 flex items-center gap-3.5">
                <div className="h-6 w-6 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold font-mono">
                  3
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium block">
                    Automate & Invest
                  </span>
                  <span className="text-[10px] text-white/40 block">
                    Non-Custodial DCA Execution
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="relative z-10 pt-4 flex items-center gap-2 text-[11px] text-white/40">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Robinhood Chain Non-Custodial &bull; End-to-End Cryptographic Proof</span>
          </div>
        </div>

        {/* RIGHT COLUMN: WALLET SELECTION */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-[#0d0c12]">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium mb-2">
                <Star size={12} className="text-primary fill-primary/30" />
                <span>Robinhood Chain Mainnet (Chain ID: 4663)</span>
              </div>
              <h1 className="font-header text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Connect Your Wallet
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Select your Web3 wallet extension or scan with WalletConnect to get started.
              </p>
            </div>

            {/* Available Wallets List (EIP-6963 + Fallbacks) */}
            <div className="space-y-2.5">
              {/* Dynamic Detected Wallets in Chrome (Zerion, MetaMask, Rabby, Coinbase, etc.) */}
              {detectedWallets.length > 0 ? (
                detectedWallets.map((wallet) => {
                  const isThisConnecting = isConnectingWallet && selectedWalletName === wallet.info.name;
                  const isThisConnected = isWalletConnected && selectedWalletName === wallet.info.name;

                  return (
                    <button
                      key={wallet.info.uuid || wallet.info.rdns}
                      type="button"
                      onClick={() => handleConnectProvider(wallet)}
                      disabled={isConnectingWallet}
                      className={`w-full text-left rounded-2xl border p-3.5 flex items-center justify-between transition-all group cursor-pointer ${
                        isThisConnected
                          ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/40"
                      } ${isConnectingWallet && !isThisConnecting ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-1.5">
                          {wallet.info.icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={wallet.info.icon}
                              alt={wallet.info.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getWalletLogo(wallet.info.name)}
                              alt={wallet.info.name}
                              className="h-full w-full object-contain"
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
                              {wallet.info.name}
                            </span>
                            {isThisConnected ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded border border-emerald-400/20 font-medium">
                                <Check size={10} />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 font-medium">
                                <Star size={10} className="fill-amber-400" />
                                Detected
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/40 block">
                            Robinhood Chain Mainnet Ready (4663)
                          </span>
                        </div>
                      </div>
                      {isThisConnecting ? (
                        <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
                          <Loader2 size={15} className="animate-spin" />
                          <span className="text-[11px]">Connecting...</span>
                        </div>
                      ) : isThisConnected ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <Check size={13} />
                        </div>
                      ) : (
                        <ChevronRight size={15} className="text-white/30 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  );
                })
              ) : null}

              {/* Explicit MetaMask Extension Card */}
              {!detectedWallets.some((p) => p.info.rdns === "io.metamask" || p.info.name.toLowerCase().includes("metamask")) && (
                <button
                  type="button"
                  onClick={() => handleConnectFallbackInjected("MetaMask")}
                  disabled={isConnectingWallet}
                  className={`w-full text-left rounded-2xl border p-3.5 flex items-center justify-between transition-all group cursor-pointer ${
                    isWalletConnected && selectedWalletName.toLowerCase().includes("metamask")
                      ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center overflow-hidden p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getWalletLogo("metamask")}
                        alt="MetaMask"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
                          MetaMask
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded border border-emerald-400/20 font-medium">
                          Ready
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block">
                        Direct connection to MetaMask on Chain ID 4663
                      </span>
                    </div>
                  </div>
                  {isConnectingWallet && selectedWalletName === "MetaMask" ? (
                    <Loader2 size={15} className="animate-spin text-primary" />
                  ) : (
                    <ChevronRight size={15} className="text-white/30 group-hover:text-white transition-colors" />
                  )}
                </button>
              )}

              {/* Fallback if no EIP-6963 detected wallets */}
              {detectedWallets.length === 0 && (
                <button
                  type="button"
                  onClick={() => handleConnectFallbackInjected("Browser Extension Wallet")}
                  disabled={isConnectingWallet}
                  className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] p-3.5 flex items-center justify-between transition-all group hover:border-primary/40 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getWalletLogo("zerion")}
                        alt="Zerion / MetaMask"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
                          Browser Wallet (Zerion / Rabby)
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 font-medium">
                          <Star size={10} className="fill-amber-400" />
                          Extension
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block">
                        Connect via window.ethereum on Chain ID 4663
                      </span>
                    </div>
                  </div>
                  {isConnectingWallet ? (
                    <Loader2 size={15} className="animate-spin text-primary" />
                  ) : (
                    <ChevronRight size={15} className="text-white/30 group-hover:text-white transition-colors" />
                  )}
                </button>
              )}

              {/* WalletConnect Option */}
              <button
                type="button"
                onClick={() => setShowWalletConnectDialog(true)}
                disabled={isConnectingWallet}
                className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] p-3.5 flex items-center justify-between transition-all group hover:border-primary/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center overflow-hidden p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getWalletLogo("walletconnect")}
                      alt="WalletConnect"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
                        WalletConnect
                      </span>
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                        Mobile & QR
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 block">
                      Connect with Zerion Mobile, MetaMask Mobile, Rainbow
                    </span>
                  </div>
                </div>
                <QrCode size={15} className="text-white/40 group-hover:text-white transition-colors" />
              </button>

              {/* Instant 1-Click Robinhood Vault Fallback */}
              <button
                type="button"
                onClick={() => handleConnectFallbackInjected("Robinhood Embedded")}
                disabled={isConnectingWallet}
                className="w-full text-left rounded-2xl border border-dashed border-white/15 bg-white/[0.01] hover:bg-white/[0.04] p-3 flex items-center justify-between transition-all group hover:border-primary/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white/90 group-hover:text-primary transition-colors">
                        Robinhood Embedded Vault
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded border border-emerald-400/20 font-medium">
                        Instant 1-Click
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 block">
                      Pre-provisioned deterministic Robinhood Mainnet address
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-white/30 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Connected Wallet Status Box */}
            {isWalletConnected && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4 animate-in fade-in-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Connected: {selectedWalletName || "Robinhood Chain"}
                  </span>
                  <button
                    type="button"
                    onClick={handleDisconnectWallet}
                    className="text-[11px] text-white/50 hover:text-rose-400 underline transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
                <div className="font-mono text-xs text-white/90 break-all bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <span>{walletAddress}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      toast.success("Wallet address copied to clipboard!");
                    }}
                    className="text-white/40 hover:text-white ml-2 transition-colors shrink-0"
                    title="Copy address"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons using Shadcn Button */}
            <div className="pt-2 space-y-3">
              <Button
                type="button"
                onClick={handleProceedToDashboard}
                className="w-full h-12 rounded-2xl bg-white hover:bg-white/90 text-zinc-950 font-semibold text-xs sm:text-sm shadow-none"
              >
                <span className="flex items-center gap-2">
                  <span>{isWalletConnected ? "Proceed to SERV Reasoning & Dashboard" : "Enter Dashboard as Guest"}</span>
                  <ArrowRight size={15} />
                </span>
              </Button>

              {/* Clear all connected wallets reset button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    handleDisconnectWallet();
                    toast.success("Wallet connection reset.");
                  }}
                  className="text-[11px] text-white/40 hover:text-white/70 underline transition-colors cursor-pointer"
                >
                  Reset Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WalletConnect QR Code Modal using Shadcn Dialog */}
      <Dialog open={showWalletConnectDialog} onOpenChange={setShowWalletConnectDialog}>
        <DialogContent className="sm:max-w-md bg-[#0e0d16] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <QrCode size={18} className="text-blue-400" />
              <span>WalletConnect &bull; Robinhood Chain</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Scan with Zerion, MetaMask Mobile, Rainbow, or Trust Wallet to connect.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              <div className="w-48 h-48 bg-zinc-950 rounded-xl p-2 flex flex-col items-center justify-between border-2 border-primary/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />
                <div className="flex justify-between w-full">
                  <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </div>
                  <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </div>
                </div>
                <div className="my-auto text-center">
                  <QrCode size={48} className="text-primary mx-auto animate-pulse" />
                  <span className="text-[9px] font-mono text-white/70 block mt-1">ROBINHOOD MAINNET</span>
                </div>
                <div className="flex justify-between w-full">
                  <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </div>
                  <div className="w-8 h-8 border border-white/40 rounded flex items-center justify-center">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-white/50">
              Chain ID: <span className="font-mono text-primary font-semibold">4663</span> (Robinhood Chain)
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowWalletConnectDialog(false);
                handleConnectFallbackInjected("WalletConnect");
              }}
              className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white"
            >
              Simulate Mobile Session Connect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
