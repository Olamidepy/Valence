"use client";

import React, { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ValenceLogo } from "@/components/valence-logo";
import Icon from "@/components/icon";
import {
  Wallet,
  Eye,
  EyeOff,
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

  // Onboarding Step: 1 = Auth (Google/Email), 2 = Connect Wallet
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [isLoginMode, setIsLoginMode] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Authenticated User State
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  // Live EIP-6963 Injected Wallets Discovery (Zerion, MetaMask, Rabby, Coinbase, etc.)
  const detectedWallets = useInjectedWallets();

  // Wallet Connection State
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [selectedWalletName, setSelectedWalletName] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // WalletConnect Modal State
  const [showWalletConnectDialog, setShowWalletConnectDialog] = useState<boolean>(false);

  // Check localStorage on mount:
  // Purge any stored wallet so wallets never connect automatically
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("valence_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.wallet || parsed.walletType) {
          delete parsed.wallet;
          delete parsed.walletType;
          localStorage.setItem("valence_user", JSON.stringify(parsed));
        }
        if (parsed.email || parsed.username) {
          setAuthenticatedUser(parsed);
          // Stay on Step 1 so the user sees the sign-in options / active session card!
        }
      }
      localStorage.removeItem("valence_connected_wallet");
      setIsWalletConnected(false);
      setWalletAddress("");
      setSelectedWalletName("");
      clearActiveProvider();
    } catch (e) {
      console.warn("Could not check user from localStorage", e);
    }
  }, []);

  // Clean wallet disconnect handler
  const handleDisconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    setSelectedWalletName("");
    clearActiveProvider();
    try {
      const existing = localStorage.getItem("valence_user");
      if (existing) {
        const parsed = JSON.parse(existing);
        delete parsed.wallet;
        delete parsed.walletType;
        localStorage.setItem("valence_user", JSON.stringify(parsed));
        setAuthenticatedUser(parsed);
      }
      localStorage.removeItem("valence_connected_wallet");
      localStorage.removeItem("walletconnect");
    } catch {}
    toast.info("Wallet disconnected. No wallet will auto-connect.");
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

  // Ensure Google Identity Services script is loaded and ready
  const ensureGoogleLoaded = async (): Promise<any> => {
    if (typeof window === "undefined") return null;
    const win = window as any;
    if (win.google?.accounts?.oauth2) {
      return win.google;
    }

    // Check if script tag exists
    let script = document.getElementById("google-gsi-client") as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Wait up to 5 seconds for Google script to initialize
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (win.google?.accounts?.oauth2) {
        return win.google;
      }
    }
    return win.google || null;
  };

  // 1. Live Google Authentication with Google Identity Services (GIS)
  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    toast.info("Opening Google Authentication...", { duration: 2500 });

    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new Error("Google Client ID is missing. Please check NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.");
      }

      const googleObj = await ensureGoogleLoaded();

      if (!googleObj?.accounts?.oauth2) {
        throw new Error(
          "Google Identity Services failed to load. Please check your internet connection or disable ad-blockers."
        );
      }

      const tokenClient = googleObj.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: "email profile openid",
        prompt: "select_account", // ALWAYS force Google to display account selection screen
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            if (tokenResponse.error === "popup_closed_by_user") {
              toast.info("Google Sign-In popup was closed.");
            } else {
              toast.error(`Google Sign-In error: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            setIsSubmitting(false);
            return;
          }

          try {
            toast.loading("Verifying Google account...", { id: "google-auth" });
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const googleUser = await userInfoRes.json();

            if (!googleUser.email) {
              throw new Error("Could not retrieve email from Google account.");
            }

            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: googleUser.email,
                name: googleUser.name || googleUser.given_name,
              }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Google authentication failed.");

            // Do NOT store any pre-attached wallet; user must explicitly connect in step 2
            const cleanUser = {
              ...data.user,
            };
            delete cleanUser.wallet;
            delete cleanUser.walletType;

            setAuthenticatedUser(cleanUser);
            localStorage.setItem("valence_user", JSON.stringify(cleanUser));
            toast.dismiss("google-auth");
            toast.success(`Welcome, ${googleUser.name || googleUser.email}!`);
            setCurrentStep(2);
          } catch (err: any) {
            toast.dismiss("google-auth");
            toast.error(err.message || "Failed to finalize Google authentication.");
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err: any) {
      toast.error(err.message || "Failed to authenticate with Google.");
      setIsSubmitting(false);
    }
  };

  // 2. Apple Sign-In (Mock notice only - does not transition)
  const handleAppleAuth = () => {
    toast.info("Apple Sign-In is coming soon in the next release!", {
      description: "Please continue with Google or Email for live Mainnet access.",
      duration: 3500,
    });
  };

  // 3. Email & Password Submission -> Transitions to Step 2
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const user = {
        username: username || email.split("@")[0],
        email,
        provider: "email",
        network: "Robinhood Chain Mainnet",
        chainId: 4663,
        registeredAt: new Date().toISOString(),
      };
      setAuthenticatedUser(user);
      localStorage.setItem("valence_user", JSON.stringify(user));
      toast.success(
        isLoginMode
          ? "Welcome back to Valence! Next: Connect your Robinhood Chain wallet."
          : "Account created! Next: Connect your Robinhood Chain wallet."
      );
      setIsSubmitting(false);
      setCurrentStep(2);
    }, 600);
  };

  // 4. Live Multi-Wallet Connection (Zerion, MetaMask, Rabby, Phantom, etc. on Chain ID 4663)
  const handleConnectProvider = async (detail: EIP6963ProviderDetail) => {
    setIsConnectingWallet(true);
    setSelectedWalletName(detail.info.name);
    toast.info(`Connecting to ${detail.info.name} on Robinhood Chain Mainnet...`);

    try {
      // Connects account and safely attempts network switch/add to Robinhood Chain (4663)
      const account = await switchToRobinhoodMainnet(detail.provider);

      setWalletAddress(account);
      setIsWalletConnected(true);
      setActiveProvider(detail.provider, detail.info.name);
      sessionStorage.setItem("valence_active_wallet", account);
      window.dispatchEvent(
        new CustomEvent("valence:wallet_connected", {
          detail: { address: account, name: detail.info.name },
        })
      );

      toast.success(`Connected ${account.slice(0, 6)}...${account.slice(-4)} via ${detail.info.name}!`);
    } catch (err: any) {
      console.error("Provider connect error:", err);
      const msg = err?.message || "";
      if (err?.code === 4001 || msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("cancelled")) {
        toast.info(`Connection was cancelled in ${detail.info.name}.`);
      } else if (msg.includes("already pending") || err?.code === -32002) {
        toast.warning(`A connection request is already pending in ${detail.info.name}. Please check your browser extension.`);
      } else if (msg.includes("wallet must has at least one account") || msg.includes("at least one account")) {
        toast.error(
          `${detail.info.name} Notice: Active profile is in 'Watch-Only' mode. Please open ${detail.info.name}, switch to an active account (or import key), then reconnect.`,
          { duration: 8000 }
        );
      } else {
        toast.error(msg || `Failed to connect with ${detail.info.name}`);
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // 5. Connect Generic Injected Wallet fallback (e.g. window.ethereum / window.zerionWallet / Mobile)
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
          win.__valenceActiveWallet = account;
          win.__valenceActiveWalletName = name;
          window.dispatchEvent(
            new CustomEvent("valence:wallet_connected", {
              detail: { address: account, name },
            })
          );
          toast.success(`Connected ${account.slice(0, 6)}...${account.slice(-4)} via ${name}!`);
        } catch (err: any) {
          const msg = err?.message || "";
          if (err?.code === 4001 || msg.toLowerCase().includes("user rejected")) {
            toast.info("Connection was cancelled in your wallet.");
          } else {
            toast.error(msg || "Wallet connection rejected.");
          }
        } finally {
          setIsConnectingWallet(false);
        }
        return;
      }
    }

    toast.error("No Web3 wallet extension detected in browser.");
    setIsConnectingWallet(false);
  };

  // 6. Complete Onboarding & Enter SERV Reasoning Dashboard
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
    toast.success("Robinhood Chain Mainnet active. Navigating to SERV AI Reasoning...");
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

          {/* Center Content: Title & 3 Progress Step Cards (Removed top badge per user request) */}
          <div className="relative z-10 my-auto py-8">
            <h2 className="font-header text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              {currentStep === 1 ? "Get Started with Us" : "Connect Mainnet Wallet"}
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mb-8 max-w-sm">
              {currentStep === 1
                ? "Authenticate your identity with Google or email to begin tokenized equity investing."
                : "Connect your Robinhood Chain Web3 wallet to authorize autonomous trade execution."}
            </p>

            {/* 3 Step Cards */}
            <div className="space-y-3 max-w-sm">
              {/* Step 1 Card */}
              <div
                className={`rounded-2xl px-5 py-3.5 flex items-center gap-3.5 transition-all ${
                  currentStep === 1
                    ? "bg-white text-zinc-950 shadow-none"
                    : "border border-white/10 bg-white/5 backdrop-blur-md text-white/80"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    currentStep === 1 ? "bg-zinc-900 text-white" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 size={14} /> : "1"}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold block">
                    {currentStep > 1 ? "Identity Verified" : "Sign in with Google or Email"}
                  </span>
                  <span className={`text-[10px] block ${currentStep === 1 ? "text-zinc-600" : "text-white/40"}`}>
                    {currentStep > 1 ? authenticatedUser?.email || "Account confirmed" : "Step 1: User verification"}
                  </span>
                </div>
              </div>

              {/* Step 2 Card */}
              <div
                className={`rounded-2xl px-5 py-3.5 flex items-center gap-3.5 transition-all ${
                  currentStep === 2
                    ? "bg-white text-zinc-950 shadow-none"
                    : "border border-white/10 bg-white/5 backdrop-blur-md text-white/80"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    currentStep === 2 ? "bg-zinc-900 text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  2
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold block">
                    Connect Robinhood Chain
                  </span>
                  <span className={`text-[10px] block ${currentStep === 2 ? "text-zinc-600" : "text-white/40"}`}>
                    Deterministic EVM Mainnet Address (4663)
                  </span>
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white/80 px-5 py-3.5 flex items-center gap-3.5">
                <div className="h-6 w-6 rounded-full bg-white/10 text-white/70 flex items-center justify-center text-xs font-bold font-mono">
                  3
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
            </div>
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="relative z-10 pt-4 flex items-center gap-2 text-[11px] text-white/40">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Robinhood Chain Non-Custodial &bull; End-to-End Cryptographic Proof</span>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-[#0d0c12]">
          <div className="max-w-md w-full mx-auto">
            {/* STEP 1: AUTHENTICATION FORM */}
            {currentStep === 1 ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h1 className="font-header text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {isLoginMode ? "Log In to Valence" : "Sign Up Account"}
                  </h1>
                  <p className="text-xs text-white/50 mt-1">
                    {isLoginMode
                      ? "Enter your credentials to access your autonomous portfolio."
                      : "Sign in with Google for instant access, or create an account below."}
                  </p>
                </div>

                {/* Active Session Info Card if user already has a saved email */}
                {authenticatedUser?.email && (
                  <div className="mb-5 p-3.5 rounded-2xl border border-primary/40 bg-primary/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white/50 block text-[10px] font-mono">Current Signed-In Session:</span>
                      <span className="font-semibold text-white truncate max-w-[200px] block">{authenticatedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          localStorage.removeItem("valence_user");
                          localStorage.removeItem("valence_connected_wallet");
                          setAuthenticatedUser(null);
                          toast.info("Signed out. You can now sign in with Google.");
                        }}
                        className="h-7 text-[11px] text-white/60 hover:text-white hover:bg-white/10"
                      >
                        Sign Out
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setCurrentStep(2)}
                        className="h-7 text-[11px] bg-white text-zinc-950 hover:bg-white/90 font-medium"
                      >
                        Continue &rarr;
                      </Button>
                    </div>
                  </div>
                )}

                {/* Social Auth Buttons: Google (Primary) + Apple (Mock) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleAuth}
                    disabled={isSubmitting}
                    className="h-11 border-primary/30 bg-primary/10 hover:bg-primary/20 text-white text-xs font-semibold hover:border-primary/50"
                  >
                    <Icon name="google" size={17} className="mr-2" />
                    <span>{isSubmitting ? "Connecting..." : "Google"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAppleAuth}
                    disabled={isSubmitting}
                    className="h-11 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium hover:border-white/20"
                  >
                    <Icon name="apple" size={17} className="mr-2" />
                    <span>Apple</span>
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center mb-6">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-[#0d0c12] px-3 text-[11px] font-medium text-white/40 uppercase tracking-wider absolute">
                    Or with Email
                  </span>
                </div>

                {/* Email Form (NO WALLET CARD HERE) */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLoginMode && (
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="eg. satoshi_investor"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="eg. alex.investor@gmail.com"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {!isLoginMode && (
                      <p className="text-[11px] text-white/40 mt-1">
                        Must be at least 8 characters.
                      </p>
                    )}
                  </div>

                  {/* Shadcn Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 h-11 rounded-xl bg-white hover:bg-white/90 text-zinc-950 font-semibold text-xs sm:text-sm shadow-none"
                  >
                    {isSubmitting ? (
                      "Authenticating..."
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>{isLoginMode ? "Log In & Continue" : "Sign Up & Continue"}</span>
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </Button>
                </form>

                {/* Bottom Toggle */}
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLoginMode(!isLoginMode)}
                    className="text-xs text-white/60 hover:text-white transition-colors"
                  >
                    {isLoginMode ? (
                      <span>
                        Don&apos;t have an account?{" "}
                        <strong className="text-white font-semibold underline underline-offset-4">
                          Sign up
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Already have an account?{" "}
                        <strong className="text-white font-semibold underline underline-offset-4">
                          Log in
                        </strong>
                      </span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* STEP 2: DEDICATED CONNECT WALLET SCREEN (CLEAN, NO REDUNDANT BANNERS) */
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium mb-2">
                    <Star size={12} className="text-primary fill-primary/30" />
                    <span>Step 2 &bull; Robinhood Chain Mainnet</span>
                  </div>
                  <h1 className="font-header text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Connect Your Wallet
                  </h1>
                  <p className="text-xs text-white/50 mt-1">
                    Connect your Web3 browser extension or scan with WalletConnect.
                  </p>
                </div>

                {/* Available Chrome Wallets List (EIP-6963 + Fallbacks) */}
                <div className="space-y-2.5">
                  {/* Dynamic Detected Wallets in Chrome (Zerion, MetaMask, Rabby, etc.) */}
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

                  {/* Explicit MetaMask Extension Card (Always accessible even if EIP-6963 hasn't announced) */}
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

                  {/* Fallback if no EIP-6963 detected wallets at all */}
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
                  {isWalletConnected && (
                    <Button
                      type="button"
                      onClick={handleProceedToDashboard}
                      className="w-full h-12 rounded-2xl bg-white hover:bg-white/90 text-zinc-950 font-semibold text-xs sm:text-sm shadow-none"
                    >
                      <span className="flex items-center gap-2">
                        <span>Proceed to SERV Reasoning & Dashboard</span>
                        <ArrowRight size={15} />
                      </span>
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    &larr; Back to account details
                  </button>

                  {/* Clear all connected wallets reset button */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        handleDisconnectWallet();
                        localStorage.removeItem("valence_connected_wallet");
                        localStorage.removeItem("walletconnect");
                        toast.success("All wallet connections cleared. Wallets will not auto-connect.");
                      }}
                      className="text-[11px] text-rose-400/70 hover:text-rose-300 underline transition-colors cursor-pointer"
                    >
                      🔒 Clear All Connected Wallets (Reset Sessions)
                    </button>
                  </div>
                </div>
              </div>
            )}
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
            {/* High-tech QR Code Box */}
            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              {/* QR Pattern visual representation */}
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

            <div className="text-center space-y-1">
              <p className="text-xs text-white/80 font-medium">Scan with your mobile wallet camera</p>
              <p className="text-[11px] text-white/40">Switching to Chain ID: 4663 upon connection</p>
            </div>

            {/* Quick simulate pair button */}
            <Button
              type="button"
              onClick={() => {
                setShowWalletConnectDialog(false);
                handleConnectFallbackInjected("WalletConnect Mobile");
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-10 rounded-xl"
            >
              <span>Pair Mobile Wallet</span>
              <ExternalLink size={14} className="ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Identity Services Client Script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    </div>
  );
}
