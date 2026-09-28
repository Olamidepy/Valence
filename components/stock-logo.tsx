"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface StockLogoProps {
  symbol?: string;
  ticker?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  token?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-14 w-14 text-base",
};

export function StockLogo({
  symbol,
  ticker,
  name,
  size = "md",
  className,
  token,
}: StockLogoProps) {
  const rawSymbol = symbol || ticker || "";
  const cleanSymbol = rawSymbol.toUpperCase().trim();
  const LOGO_DEV_TOKEN =
    token ||
    process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ||
    "YOUR_PUBLISHABLE_KEY";

  const [hasError, setHasError] = useState<boolean>(false);

  // Reset error state if symbol or token changes
  useEffect(() => {
    setHasError(false);
  }, [cleanSymbol, LOGO_DEV_TOKEN]);

  // Fallback monogram/initials if logo API fails or ticker is missing
  const monogram =
    size === "xs"
      ? cleanSymbol.slice(0, 2)
      : cleanSymbol.length <= 3
      ? cleanSymbol
      : cleanSymbol.slice(0, 3);

  const logoUrl = cleanSymbol
    ? `https://img.logo.dev/ticker/${cleanSymbol}?token=${LOGO_DEV_TOKEN}`
    : "";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-zinc-950 select-none shadow-sm transition-transform hover:scale-105 p-0.5",
        sizeClasses[size],
        className
      )}
      title={name ? `${name} (${cleanSymbol})` : cleanSymbol}
    >
      {!hasError && logoUrl ? (
        <img
          src={logoUrl}
          alt={name ? `${name} (${cleanSymbol}) logo` : `${cleanSymbol} logo`}
          className="h-full w-full object-contain rounded-full"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-secondary font-mono font-bold text-foreground text-center">
          {monogram}
        </span>
      )}
    </div>
  );
}

export default StockLogo;
