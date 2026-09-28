"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers } from "lucide-react";
import { StockLogo } from "@/components/stock-logo";
import { formatCurrency, formatPercent } from "@/lib/utils";

export interface BasketTableItem {
  id?: string;
  ticker: string;
  name?: string;
  weightPct: number;
  rationale: string;
  priceUsd?: number;
  change24hPct?: number;
  poolLiquidityUsd?: number;
  wasTrimmed?: boolean;
  originalWeightPct?: number;
}

interface BasketTableProps {
  holdings: BasketTableItem[];
  showDetails?: boolean;
  totalAmountUsd?: number;
}

export function BasketTable({ holdings, showDetails = true, totalAmountUsd }: BasketTableProps) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <Layers size={24} className="mb-2 opacity-40" />
        <p>No tokenized equities in basket.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/70 overflow-x-auto bg-card/60 backdrop-blur-sm">
      <Table>
        <TableHeader className="bg-secondary/40">
          <TableRow>
            <TableHead className="min-w-[130px] sm:w-[180px]">Asset</TableHead>
            <TableHead className="min-w-[120px] sm:w-[170px]">
              {totalAmountUsd && totalAmountUsd > 0 ? "Weight & Allocation" : "Weight"}
            </TableHead>
            <TableHead className="hidden md:table-cell">SERV AI Rationale</TableHead>
            {showDetails && (
              <>
                <TableHead className="text-right min-w-[70px]">Price</TableHead>
                <TableHead className="text-right hidden sm:table-cell">24h</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Pool Depth</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((item) => (
            <TableRow key={item.ticker} className="group">
              {/* Asset Name + Ticker */}
              <TableCell className="font-medium">
                <div className="flex items-center gap-2.5">
                  <StockLogo symbol={item.ticker} name={item.name} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-foreground">
                        {item.ticker}
                      </span>
                      {item.wasTrimmed && (
                        <Badge variant="warning" className="text-[10px] py-0 px-1.5 h-4">
                          Trimmed
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground block truncate max-w-[120px]">
                      {item.name || `${item.ticker} Tokenized`}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Weight % and bar with dynamic dollar amount */}
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold font-mono text-foreground">
                        {item.weightPct}%
                      </span>
                      {totalAmountUsd && totalAmountUsd > 0 && (
                        <span className="text-[11px] font-mono text-primary font-semibold">
                          (${((totalAmountUsd * item.weightPct) / 100).toFixed(2)})
                        </span>
                      )}
                    </div>
                    {item.wasTrimmed && item.originalWeightPct && (
                      <span className="text-[10px] text-muted-foreground line-through font-mono">
                        {item.originalWeightPct}%
                      </span>
                    )}
                  </div>
                  <Progress value={item.weightPct} className="h-1.5" />
                </div>
              </TableCell>

              {/* Rationale */}
              <TableCell className="hidden md:table-cell">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {item.rationale}
                </p>
              </TableCell>

              {/* Market Data */}
              {showDetails && (
                <>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {item.priceUsd ? formatCurrency(item.priceUsd) : "—"}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {item.change24hPct !== undefined ? (
                      <span
                        className={`text-xs font-mono font-medium ${
                          item.change24hPct >= 0
                            ? "text-emerald-400"
                            : "text-destructive"
                        }`}
                      >
                        {formatPercent(item.change24hPct)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {item.poolLiquidityUsd
                      ? `$${(item.poolLiquidityUsd / 1_000_000).toFixed(1)}M`
                      : "—"}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default BasketTable;
