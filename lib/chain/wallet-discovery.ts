"use client";

import { useState, useEffect } from "react";

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<EIP6963ProviderDetail>;
  }
}

/**
 * Hook to discover all modern Web3 browser extension wallets (EIP-6963)
 * Detects Zerion, MetaMask, Rabby, Coinbase Wallet, Rainbow, etc. dynamically without conflicts.
 */
export function useInjectedWallets() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    const handleAnnounce = (event: CustomEvent<EIP6963ProviderDetail>) => {
      if (!event.detail || !event.detail.info) return;

      setProviders((prev) => {
        // Prevent duplicates by uuid or rdns
        if (prev.some((p) => p.info.uuid === event.detail.info.uuid || p.info.rdns === event.detail.info.rdns)) {
          return prev;
        }
        return [...prev, event.detail];
      });
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    // Request all installed wallet extensions to announce themselves
    // Request all installed wallet extensions to announce themselves via EIP-6963
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    // Re-dispatch after short delay in case extensions inject asynchronously
    const reReq1 = setTimeout(() => window.dispatchEvent(new Event("eip6963:requestProvider")), 80);
    const reReq2 = setTimeout(() => window.dispatchEvent(new Event("eip6963:requestProvider")), 250);

    // Multi-wallet fallback detection (MetaMask, Zerion, Rabby, Coinbase)
    const timeout = setTimeout(() => {
      setProviders((prev) => {
        const fallbackList = [...prev];
        const win = window as any;

        // Cache globally for instant access by modals
        win.__valenceEIP6963Providers = fallbackList;

        // 1. Check Zerion direct provider
        if (win.zerionWallet && !fallbackList.some((p) => p.info.name.toLowerCase().includes("zerion") || p.info.rdns === "io.zerion.wallet")) {
          fallbackList.push({
            info: {
              uuid: "zerion-injected",
              name: "Zerion Wallet",
              icon: "",
              rdns: "io.zerion.wallet",
            },
            provider: win.zerionWallet,
          });
        }

        // 2. Check window.ethereum.providers array (when multiple extensions coexist)
        if (win.ethereum) {
          if (Array.isArray(win.ethereum.providers)) {
            win.ethereum.providers.forEach((prov: any, index: number) => {
              const isZr = !!prov.isZerion;
              const isMm = !!(prov.isMetaMask && !prov.isZerion && !prov.isRabby);
              const isRb = !!prov.isRabby;
              const isCb = !!prov.isCoinbaseWallet;

              const name = isZr ? "Zerion Wallet" : isMm ? "MetaMask" : isRb ? "Rabby Wallet" : isCb ? "Coinbase Wallet" : `Injected Wallet ${index + 1}`;
              const rdns = isZr ? "io.zerion.wallet" : isMm ? "io.metamask" : isRb ? "io.rabby" : isCb ? "com.coinbase.wallet" : `io.injected.${index}`;

              if (!fallbackList.some((p) => p.info.rdns === rdns || p.info.name.toLowerCase() === name.toLowerCase())) {
                fallbackList.push({
                  info: {
                    uuid: `injected-${rdns}-${index}`,
                    name,
                    icon: "",
                    rdns,
                  },
                  provider: prov,
                });
              }
            });
          } else {
            // Single or overridden window.ethereum
            // If it's MetaMask
            if (win.ethereum.isMetaMask && !fallbackList.some((p) => p.info.name.toLowerCase().includes("metamask") || p.info.rdns === "io.metamask")) {
              fallbackList.push({
                info: {
                  uuid: "injected-metamask",
                  name: "MetaMask",
                  icon: "",
                  rdns: "io.metamask",
                },
                provider: win.ethereum,
              });
            }
            // If it's Zerion
            if (win.ethereum.isZerion && !fallbackList.some((p) => p.info.name.toLowerCase().includes("zerion") || p.info.rdns === "io.zerion.wallet")) {
              fallbackList.push({
                info: {
                  uuid: "injected-zerion",
                  name: "Zerion Wallet",
                  icon: "",
                  rdns: "io.zerion.wallet",
                },
                provider: win.ethereum,
              });
            }
            // Generic browser extension fallback if still nothing
            if (fallbackList.length === 0) {
              fallbackList.push({
                info: {
                  uuid: "generic-injected",
                  name: "Browser Extension Wallet",
                  icon: "",
                  rdns: "io.injected.wallet",
                },
                provider: win.ethereum,
              });
            }
          }
        }

        win.__valenceEIP6963Providers = fallbackList;
        return fallbackList;
      });
    }, 150);

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
      clearTimeout(reReq1);
      clearTimeout(reReq2);
      clearTimeout(timeout);
    };
  }, []);

  return providers;
}

/**
 * Robust utility to find MetaMask's direct provider without interference from Zerion or Rabby
 */
export function findMetaMaskProvider(): any {
  if (typeof window === "undefined") return null;
  const win = window as any;

  // 1. Check EIP-6963 discovered providers
  if (Array.isArray(win.__valenceEIP6963Providers)) {
    const mm = win.__valenceEIP6963Providers.find(
      (p: any) => p.info?.rdns === "io.metamask" || p.info?.name?.toLowerCase().includes("metamask")
    );
    if (mm?.provider) return mm.provider;
  }

  // 2. Check window.ethereum.providers array
  if (Array.isArray(win.ethereum?.providers)) {
    const mm = win.ethereum.providers.find((p: any) => p.isMetaMask && !p.isZerion && !p.isRabby);
    if (mm) return mm;
  }

  // 3. Check window.ethereum
  if (win.ethereum?.isMetaMask && !win.ethereum?.isZerion) {
    return win.ethereum;
  }

  if (win.ethereum?.isMetaMask) {
    return win.ethereum;
  }

  return win.ethereum || null;
}

/**
 * Switch or add Robinhood Chain Mainnet (Chain ID 4663) to the selected provider
 */
export async function switchToRobinhoodMainnet(provider: any): Promise<string> {
  const chainIdHex = "0x1237"; // 4663 in hex

  // 1. Force wallet extension popup (EIP-2255) so MetaMask/Zerion always pops up
  let accounts: string[] = [];
  if (typeof provider.request === "function") {
    try {
      // wallet_requestPermissions explicitly forces MetaMask popup to open and prompt user
      await provider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (permErr: any) {
      if (permErr?.code === 4001 || permErr?.message?.toLowerCase().includes("user rejected") || permErr?.message?.toLowerCase().includes("denied")) {
        throw new Error("Connection request was rejected or cancelled in your wallet extension.");
      }
      // If wallet extension does not support wallet_requestPermissions, proceed to eth_requestAccounts
    }
    accounts = await provider.request({ method: "eth_requestAccounts" });
  } else if (typeof provider.enable === "function") {
    accounts = await provider.enable();
  } else if (typeof provider.send === "function") {
    const res = await provider.send("eth_requestAccounts", []);
    accounts = Array.isArray(res) ? res : res?.result || [];
  } else {
    throw new Error("Selected wallet does not support account authorization.");
  }

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts approved by wallet.");
  }
  const userAccount = accounts[0];

  // 2. Try switching / adding Robinhood Chain Mainnet (non-blocking)
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    // Check if chain is not yet registered in wallet
    const isChainNotAdded =
      switchError?.code === 4902 ||
      switchError?.data?.originalError?.code === 4902 ||
      (typeof switchError?.message === "string" &&
        switchError.message.toLowerCase().includes("unrecognized chain"));

    if (isChainNotAdded) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: "Robinhood Chain",
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [
                "https://robinhood.api.pocket.network",
                "https://rpc.mainnet.chain.robinhood.com",
                "https://robinhood-rpc.publicnode.com",
              ],
              blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
            },
          ],
        });
      } catch (addError: any) {
        // Non-fatal if wallet rejects adding custom RPC or user skips
        console.warn("Could not add Robinhood Chain to wallet (proceeding with connected account):", addError);
      }
    } else {
      // Non-fatal if wallet rejects network switch or already on it
      console.warn("Switch network notice (proceeding with connected account):", switchError);
    }
  }

  return userAccount;
}

export function setActiveProvider(provider: any, name?: string) {
  if (typeof window !== "undefined") {
    (window as any).__valenceActiveProvider = provider;
    if (name) (window as any).__valenceActiveWalletName = name;
  }
}

export function clearActiveProvider() {
  if (typeof window !== "undefined") {
    delete (window as any).__valenceActiveProvider;
    delete (window as any).__valenceActiveWalletName;
  }
}

export function getActiveProvider(): any {
  if (typeof window === "undefined") return null;
  const win = window as any;
  if (win.__valenceActiveProvider) return win.__valenceActiveProvider;

  const activeWalletName = (
    (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("valence_active_wallet_name") : "") ||
    win.__valenceActiveWalletName ||
    ""
  ).toLowerCase();

  // If user selected MetaMask, explicitly return MetaMask provider
  if (activeWalletName.includes("metamask")) {
    const mm = findMetaMaskProvider();
    if (mm) return mm;
  }

  // If user selected Zerion, explicitly return Zerion
  if (activeWalletName.includes("zerion")) {
    if (win.zerionWallet) return win.zerionWallet;
    if (Array.isArray(win.ethereum?.providers)) {
      const zr = win.ethereum.providers.find((p: any) => p.isZerion);
      if (zr) return zr;
    }
  }

  // If user selected Rabby
  if (activeWalletName.includes("rabby")) {
    if (win.rabby) return win.rabby;
  }

  // Default fallback priority
  if (win.zerionWallet) return win.zerionWallet;
  if (win.rabby) return win.rabby;
  if (win.ethereum) {
    if (Array.isArray(win.ethereum.providers)) {
      return (
        win.ethereum.providers.find((p: any) => p.isMetaMask && !p.isZerion) ||
        win.ethereum.providers.find((p: any) => p.isZerion) ||
        win.ethereum.providers.find((p: any) => p.isRabby) ||
        win.ethereum.providers[0]
      );
    }
    return win.ethereum;
  }
  return null;
}
