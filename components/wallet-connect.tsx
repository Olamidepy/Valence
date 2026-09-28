"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, X, AlertTriangle, ChevronRight, ArrowRightLeft } from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  setActiveProvider,
  getActiveProvider,
  clearActiveProvider,
  findMetaMaskProvider,
  useInjectedWallets,
} from "@/lib/chain/wallet-discovery";
import { getChainDisplayName } from "@/lib/chain/config";

interface WalletConnectProps {
  onAddressChange?: (address: string | null) => void;
}

export function WalletConnect({ onAddressChange }: WalletConnectProps) {
  // Initialize state directly from active session if present
  const [address, setAddress] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("valence_active_wallet") || "";
    }
    return "";
  });
  const [walletName, setWalletName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("valence_active_wallet_name") || "MetaMask";
    }
    return "MetaMask";
  });
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const active = sessionStorage.getItem("valence_active_wallet");
      return Boolean(active && active.startsWith("0x"));
    }
    return false;
  });
  const [chainId, setChainId] = useState<number>(4663); // 4663 = Robinhood Chain Mainnet

  // Dynamic discovered wallets via EIP-6963
  const detectedWallets = useInjectedWallets();

  React.useEffect(() => {
    // Security: Purge any stored wallet so wallet never connects automatically on load from localStorage
    try {
      const existing = localStorage.getItem("valence_user");
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed.wallet || parsed.walletType) {
          delete parsed.wallet;
          delete parsed.walletType;
          localStorage.setItem("valence_user", JSON.stringify(parsed));
        }
      }
      localStorage.removeItem("valence_connected_wallet");
    } catch {}

    const syncWalletFromSession = () => {
      try {
        if (typeof window !== "undefined") {
          const win = window as any;
          const activeSession =
            sessionStorage.getItem("valence_active_wallet") ||
            win.__valenceActiveWallet ||
            (win.ethereum?.selectedAddress && win.__valenceActiveWallet ? win.ethereum.selectedAddress : "");
          const activeName =
            sessionStorage.getItem("valence_active_wallet_name") ||
            win.__valenceActiveWalletName ||
            "MetaMask";

          if (activeSession && activeSession.startsWith("0x")) {
            setAddress(activeSession);
            setWalletName(activeName);
            setIsConnected(true);
            onAddressChange?.(activeSession);
          } else {
            setAddress("");
            setIsConnected(false);
          }
        }
      } catch (e) {
        console.warn("Wallet sync notice:", e);
      }
    };

    syncWalletFromSession();

    // Cross-component event listeners for immediate synchronization
    const handleConnectedEvent = (e: any) => {
      const addr = e?.detail?.address || sessionStorage.getItem("valence_active_wallet");
      const name = e?.detail?.name || sessionStorage.getItem("valence_active_wallet_name") || "MetaMask";
      if (addr && addr.startsWith("0x")) {
        setAddress(addr);
        setWalletName(name);
        setIsConnected(true);
        onAddressChange?.(addr);
      }
    };

    const handleDisconnectedEvent = () => {
      setAddress("");
      setIsConnected(false);
      onAddressChange?.(null);
    };

    window.addEventListener("valence:wallet_connected", handleConnectedEvent);
    window.addEventListener("valence:wallet_disconnected", handleDisconnectedEvent);
    window.addEventListener("focus", syncWalletFromSession);

    // Wallet extension account change listeners
    if (typeof window !== "undefined") {
      const win = window as any;
      if (win.ethereum && win.ethereum.on) {
        win.ethereum.on("accountsChanged", (newAccs: string[]) => {
          if (newAccs && newAccs.length > 0) {
            setAddress(newAccs[0]);
            setIsConnected(true);
            sessionStorage.setItem("valence_active_wallet", newAccs[0]);
            onAddressChange?.(newAccs[0]);
          } else {
            setAddress("");
            setIsConnected(false);
            clearActiveProvider();
            sessionStorage.removeItem("valence_active_wallet");
            onAddressChange?.(null);
          }
        });

        win.ethereum.on("chainChanged", (hexChainId: string) => {
          const id = parseInt(hexChainId, 16);
          setChainId(id);
        });
      }
    }

    return () => {
      window.removeEventListener("valence:wallet_connected", handleConnectedEvent);
      window.removeEventListener("valence:wallet_disconnected", handleDisconnectedEvent);
      window.removeEventListener("focus", syncWalletFromSession);
    };
  }, [onAddressChange]);

  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const isRobinhoodChain = chainId === 4663 || chainId === 46630;
  const currentNetworkName = getChainDisplayName(chainId);

  const WALLET_OPTIONS = [
    { id: "metamask", name: "MetaMask", icon: "🦊", description: "Leading EVM browser extension wallet" },
    { id: "zerion", name: "Zerion Wallet", icon: "🟣", description: "Smart Web3 wallet with multi-chain portfolio tracking" },
    { id: "rabby", name: "Rabby Wallet", icon: "🐰", description: "Security-focused DeFi browser extension" },
    { id: "coinbase", name: "Coinbase Wallet", icon: "🔵", description: "Self-custody browser extension" },
    { id: "injected", name: "Auto-Detect Default", icon: "⚡", description: "Connect current active browser wallet" },
  ];

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Wallet address copied to clipboard!");
  };

  const handleToggleConnect = async () => {
    if (isConnected) {
      // Disconnect cleanly
      setIsConnected(false);
      setAddress("");
      clearActiveProvider();
      onAddressChange?.(null);
      try {
        const existing = localStorage.getItem("valence_user");
        if (existing) {
          const parsed = JSON.parse(existing);
          delete parsed.wallet;
          delete parsed.walletType;
          localStorage.setItem("valence_user", JSON.stringify(parsed));
        }
        localStorage.removeItem("valence_connected_wallet");
        sessionStorage.removeItem("valence_active_wallet");
        sessionStorage.removeItem("valence_active_wallet_name");
        if (typeof window !== "undefined") {
          delete (window as any).__valenceActiveWallet;
          delete (window as any).__valenceActiveWalletName;
          window.dispatchEvent(new CustomEvent("valence:wallet_disconnected"));
        }
      } catch {}
      toast.info("Wallet disconnected. Click Connect Wallet to reconnect.");
    } else {
      setShowWalletModal(true);
    }
  };

  const connectSpecificWallet = async (walletId: string) => {
    const win = window as any;
    let provider: any = null;
    let displayName = "MetaMask";

    if (walletId === "metamask") {
      displayName = "MetaMask";
      // Priority 1: Check EIP-6963 detected wallets
      const mmDetail = detectedWallets.find(
        (p) => p.info.rdns === "io.metamask" || p.info.name.toLowerCase().includes("metamask")
      );
      if (mmDetail?.provider) {
        provider = mmDetail.provider;
      } else {
        // Priority 2: Use dedicated findMetaMaskProvider
        provider = findMetaMaskProvider();
      }
    } else if (walletId === "zerion") {
      displayName = "Zerion";
      const zrDetail = detectedWallets.find(
        (p) => p.info.rdns === "io.zerion.wallet" || p.info.name.toLowerCase().includes("zerion")
      );
      provider = zrDetail?.provider || win.zerionWallet;
      if (!provider && Array.isArray(win.ethereum?.providers)) {
        provider = win.ethereum.providers.find((p: any) => p.isZerion);
      }
    } else if (walletId === "rabby") {
      displayName = "Rabby";
      const rbDetail = detectedWallets.find(
        (p) => p.info.rdns === "io.rabby" || p.info.name.toLowerCase().includes("rabby")
      );
      provider = rbDetail?.provider || win.rabby;
      if (!provider && Array.isArray(win.ethereum?.providers)) {
        provider = win.ethereum.providers.find((p: any) => p.isRabby);
      }
    } else if (walletId === "coinbase") {
      displayName = "Coinbase";
      const cbDetail = detectedWallets.find(
        (p) => p.info.rdns === "com.coinbase.wallet" || p.info.name.toLowerCase().includes("coinbase")
      );
      provider = cbDetail?.provider || win.coinbaseWalletExtension;
    }

    if (!provider) {
      provider = win.ethereum;
    }

    if (!provider) {
      toast.error(`Please install or unlock ${displayName} extension.`);
      return;
    }

    try {
      toast.loading(`Prompting ${displayName} to connect...`, { id: "connect-toast" });
      let accounts: string[] = [];
      if (typeof provider.request === "function") {
        try {
          const permRes = await provider.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
          // Some wallets return accounts directly in permission caveats
          if (Array.isArray(permRes) && permRes[0]?.caveats) {
            const caveat = permRes[0].caveats.find((c: any) => c.type === "restrictReturnedAccounts");
            if (caveat?.value && Array.isArray(caveat.value) && caveat.value.length > 0) {
              accounts = caveat.value;
            }
          }
        } catch (permErr: any) {
          if (permErr?.code === 4001 || permErr?.message?.toLowerCase().includes("user rejected") || permErr?.message?.toLowerCase().includes("denied")) {
            throw new Error("Connection request was rejected or cancelled in your wallet extension.");
          }
        }

        if (accounts.length === 0) {
          accounts = await provider.request({ method: "eth_requestAccounts" });
        }
      } else if (typeof provider.enable === "function") {
        accounts = await provider.enable();
      }

      toast.dismiss("connect-toast");
      if (accounts && accounts.length > 0) {
        const userAddr = accounts[0];
        setAddress(userAddr);
        setWalletName(displayName);
        setIsConnected(true);
        setActiveProvider(provider, displayName);

        // Session synchronization
        sessionStorage.setItem("valence_active_wallet", userAddr);
        sessionStorage.setItem("valence_active_wallet_name", displayName);
        win.__valenceActiveWallet = userAddr;
        win.__valenceActiveWalletName = displayName;

        // Broadcast to all pages and navbar
        window.dispatchEvent(
          new CustomEvent("valence:wallet_connected", {
            detail: { address: userAddr, name: displayName, chainId: 4663 },
          })
        );
        onAddressChange?.(userAddr);

        // Fetch active chain ID
        try {
          const idHex = await provider.request({ method: "eth_chainId" });
          if (idHex) {
            setChainId(parseInt(idHex, 16));
          }
        } catch {}

        setShowWalletModal(false);
        toast.success(`Connected ${displayName}: ${truncateAddress(userAddr, 4)}`);
      }
    } catch (err: any) {
      toast.dismiss("connect-toast");
      toast.error(err.message || `Failed to connect ${displayName}`);
    }
  };

  const handleSwitchNetwork = async () => {
    const provider = getActiveProvider();
    if (!provider) {
      toast.error("Please connect your wallet first");
      return;
    }

    toast.loading("Switching to Robinhood Chain in your wallet...", { id: "switch-toast" });
    try {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1237" }], // 4663
        });
        setChainId(4663);
        toast.dismiss("switch-toast");
        toast.success("Switched network to Robinhood Chain!");
        return;
      } catch (err: any) {
        // 4902: Chain has not been added to wallet
        if (err.code === 4902 || err.message?.includes("Unrecognized") || err.message?.includes("not found")) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x1237",
                chainName: "Robinhood Chain",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
                blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
              },
            ],
          });
          setChainId(4663);
          toast.dismiss("switch-toast");
          toast.success("Robinhood Chain added & connected!");
          return;
        }
        throw err;
      }
    } catch (switchErr: any) {
      toast.dismiss("switch-toast");
      console.warn("Could not switch to Robinhood Chain:", switchErr);
      if (switchErr.code === 4001 || switchErr.message?.includes("rejected")) {
        toast.info("Network switch request was declined.");
      } else {
        toast.info(`Active on ${currentNetworkName}. You can continue deposits on this network.`);
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Network Badge */}
        {isConnected && (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1 text-xs font-medium border ${
                isRobinhoodChain
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isRobinhoodChain ? "bg-emerald-400 animate-pulse" : "bg-primary"
                }`}
              />
              <span className="hidden sm:inline">{currentNetworkName}</span>
              <span className="sm:hidden text-[10px] font-mono">RHC</span>
            </span>
            {!isRobinhoodChain && (
              <button
                onClick={handleSwitchNetwork}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-500/20 transition-colors"
                title="Switch to Robinhood Chain (Chain ID: 4663)"
              >
                <ArrowRightLeft size={11} />
                <span className="hidden sm:inline">Switch to Robinhood</span>
                <span className="sm:hidden text-[10px]">Switch</span>
              </button>
            )}
          </div>
        )}

        {/* Wallet Button */}
        {isConnected && address ? (
          <div className="flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 backdrop-blur-md transition-all shadow-sm">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 pr-2 text-xs font-mono font-medium text-emerald-300 hover:text-white transition-colors cursor-pointer"
              title="Click to copy wallet address"
            >
              <span className="text-sm">{walletName.toLowerCase().includes("metamask") ? "🦊" : "🟣"}</span>
              <span className="font-semibold text-white/90">{truncateAddress(address, 4)}</span>
              <Copy size={12} className="opacity-60 hover:opacity-100 text-white/70" />
            </button>
            <div className="h-3.5 w-px bg-emerald-500/20 my-auto" />
            <button
              onClick={handleToggleConnect}
              className="pl-2 pr-1 text-xs text-emerald-400/80 hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Disconnect wallet"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleToggleConnect}
            className="gap-2 text-xs font-semibold cursor-pointer shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full px-3.5 py-1.5"
          >
            <Wallet size={14} />
            <span>Connect Wallet</span>
          </Button>
        )}
      </div>

      {/* Multi-Wallet Selection Dialog */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="sm:max-w-md border-border/80 bg-[#121019]/95 backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Wallet size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Web3 Wallet Connection
              </span>
            </div>
            <DialogTitle className="text-lg">Connect Any Wallet</DialogTitle>
            <DialogDescription className="text-xs">
              Select your active browser extension to authorize live deposits and executions on Robinhood Chain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            {WALLET_OPTIONS.map((opt) => {
              const isMetaMaskOpt = opt.id === "metamask";
              const isDetected = isMetaMaskOpt
                ? detectedWallets.some((p) => p.info.rdns === "io.metamask" || p.info.name.toLowerCase().includes("metamask")) || typeof window !== "undefined" && Boolean((window as any).ethereum?.isMetaMask)
                : detectedWallets.some((p) => p.info.name.toLowerCase().includes(opt.id) || p.info.rdns.includes(opt.id));

              return (
                <button
                  key={opt.id}
                  onClick={() => connectSpecificWallet(opt.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/50 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        <span>{opt.name}</span>
                        {isDetected && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                            Ready
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {opt.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}

            {/* Clear All Connected Wallets Button */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsConnected(false);
                  setAddress("");
                  clearActiveProvider();
                  onAddressChange?.(null);
                  try {
                    const existing = localStorage.getItem("valence_user");
                    if (existing) {
                      const parsed = JSON.parse(existing);
                      delete parsed.wallet;
                      delete parsed.walletType;
                      localStorage.setItem("valence_user", JSON.stringify(parsed));
                    }
                    localStorage.removeItem("valence_connected_wallet");
                    localStorage.removeItem("walletconnect");
                    sessionStorage.removeItem("valence_active_wallet");
                    sessionStorage.removeItem("valence_active_wallet_name");
                    if (typeof window !== "undefined") {
                      delete (window as any).__valenceActiveWallet;
                      delete (window as any).__valenceActiveWalletName;
                      window.dispatchEvent(new CustomEvent("valence:wallet_disconnected"));
                    }
                  } catch {}
                  setShowWalletModal(false);
                  toast.success("All wallet connections cleared. Wallets will not auto-connect.");
                }}
                className="w-full py-2 px-3 text-center text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-dashed border-rose-500/30 cursor-pointer"
              >
                🔒 Disconnect &amp; Clear All Stored Wallets (Reset)
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
