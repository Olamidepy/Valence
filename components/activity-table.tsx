"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Activity, AlertCircle, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { StockLogo } from "@/components/stock-logo";
import { formatCurrency, truncateAddress } from "@/lib/utils";

export interface ActivityTradeItem {
  id: string;
  ticker: string;
  action: "BUY" | "SELL" | "REBALANCE" | "REJECTED";
  amountUsd: number;
  txHash?: string;
  status: "CONFIRMED" | "FAILED" | "PENDING";
  rejectionReason?: string;
  executedAt: string;
  feeUsd?: number;
}

interface ActivityTableProps {
  trades: ActivityTradeItem[];
  onRefresh?: () => void;
}

export function ActivityTable({ trades, onRefresh }: ActivityTableProps) {
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = trades.filter((item) => {
    if (filterAction !== "ALL" && item.action !== filterAction) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicker = item.ticker.toLowerCase().includes(q);
      const matchTx = item.txHash?.toLowerCase().includes(q);
      const matchRejection = item.rejectionReason?.toLowerCase().includes(q);
      return matchTicker || matchTx || matchRejection;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "BUY", "REJECTED"].map((act) => (
            <Button
              key={act}
              variant={filterAction === act ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterAction(act)}
              className={`text-xs font-semibold rounded-lg ${
                filterAction === act
                  ? "bg-secondary text-foreground border border-border"
                  : "text-muted-foreground"
              }`}
            >
              {act === "ALL" ? "All Activity" : act === "BUY" ? "Executions (Buy)" : "Guardrail Interventions"}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Search ticker, tx, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-9 w-9 p-0 shrink-0"
              title="Refresh ledger"
            >
              <RefreshCw size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Real Empty State */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/40">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
            <Activity size={24} className="text-muted-foreground" />
          </div>
          <h4 className="font-header text-base font-bold text-foreground">
            No activity matches your filters
          </h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {searchQuery
              ? `No transactions match the query "${searchQuery}". Try clearing search filters.`
              : "Transactions and deterministic guardrail checks will appear here as automated runs occur."}
          </p>
          {(filterAction !== "ALL" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterAction("ALL");
                setSearchQuery("");
              }}
              className="mt-4 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto bg-card/60 backdrop-blur-md">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead>Type & Status</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden md:table-cell">Details / Audit Log</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Transaction Hash</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const isRejected = item.action === "REJECTED";

                return (
                  <TableRow key={item.id} className="hover:bg-card/80">
                    {/* Action & Status */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isRejected ? (
                          <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
                            <AlertCircle size={12} />
                            REJECTED
                          </Badge>
                        ) : (
                          <Badge variant="success" className="gap-1 text-[11px] font-semibold">
                            <CheckCircle2 size={12} />
                            BUY
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Asset Ticker */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StockLogo symbol={item.ticker} size="xs" />
                        <span className="font-bold text-sm text-foreground">
                          {item.ticker}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded">
                          RHC
                        </span>
                      </div>
                    </TableCell>

                    {/* Amount USD */}
                    <TableCell className="text-right font-mono font-bold text-sm">
                      <span className={isRejected ? "line-through text-muted-foreground" : "text-foreground"}>
                        {formatCurrency(item.amountUsd)}
                      </span>
                    </TableCell>

                    {/* Details or Rejection Reason */}
                    <TableCell className="hidden md:table-cell max-w-[260px]">
                      {isRejected ? (
                        <div className="flex items-start gap-1.5 text-xs text-amber-400">
                          <ShieldCheck size={14} className="shrink-0 mt-0.5 text-amber-400" />
                          <span className="truncate" title={item.rejectionReason}>
                            {item.rejectionReason || "Guardrail safety threshold exceeded"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>UniversalRouter v4 &bull; Permit2</span>
                          {item.feeUsd !== undefined && item.feeUsd > 0 && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              (Fee: ${item.feeUsd.toFixed(3)})
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Tx Hash with Explorer Link */}
                    <TableCell className="hidden sm:table-cell text-right font-mono text-xs">
                      {item.txHash ? (
                        <a
                          href={`https://explorer.robinhoodchain.org/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                          title="View on Robinhood Chain Explorer"
                        >
                          <span>{truncateAddress(item.txHash, 4)}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Timestamp */}
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.executedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default ActivityTable;
