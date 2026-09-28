import { defineChain } from "viem";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.ROBINHOOD_CHAIN_RPC || "https://rpc.mainnet.chain.robinhood.com",
        "https://robinhood.api.pocket.network",
      ],
    },
    public: {
      http: [
        process.env.ROBINHOOD_CHAIN_RPC || "https://rpc.mainnet.chain.robinhood.com",
        "https://robinhood.api.pocket.network",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
  contracts: {
    permit2: {
      address: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    },
    universalRouter: {
      address: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
    },
    swapRouter02: {
      address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    },
  },
});

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Testnet Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

export const arbitrumOrbit = defineChain({
  id: 421614,
  name: "Arbitrum Orbit (Valence L3)",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.ARBITRUM_ORBIT_RPC || "https://arbitrum-orbit.rpc.valence.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Orbit Explorer",
      url: "https://orbit-explorer.valence.io",
    },
  },
});

export const SUPPORTED_CHAINS = [robinhoodChain, robinhoodTestnet, arbitrumOrbit] as const;

export function getChainDisplayName(chainId?: number): string {
  switch (chainId) {
    case 4663:
      return "Robinhood Chain";
    case 46630:
      return "Robinhood Testnet";
    case 42161:
      return "Arbitrum One";
    case 421614:
      return "Arbitrum Orbit (Valence L3)";
    case 8453:
      return "Base";
    case 1:
      return "Ethereum";
    case 137:
      return "Polygon";
    case 10:
      return "Optimism";
    default:
      return chainId ? `Chain ${chainId}` : "Mainnet";
  }
}

export function getExplorerTxUrl(txHash: string, chainId?: number): string {
  if (!txHash) return "https://robinhoodchain.blockscout.com";
  switch (chainId) {
    case 42161:
      return `https://arbiscan.io/tx/${txHash}`;
    case 8453:
      return `https://basescan.org/tx/${txHash}`;
    case 1:
      return `https://etherscan.io/tx/${txHash}`;
    case 137:
      return `https://polygonscan.com/tx/${txHash}`;
    default:
      return `https://robinhoodchain.blockscout.com/tx/${txHash}`;
  }
}
