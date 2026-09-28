"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityTable, ActivityTradeItem } from "@/components/activity-table";
import { Activity, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ActivityStats {
  totalTrades: number;
  confirmedCount: number;
  rejectedCount: number;
  totalVolumeUsd: number;
}

export default function ActivityPage() {
  const [trades, setTrades] = useState<ActivityTradeItem[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalTrades: 0,
    confirmedCount: 0,
    rejectedCount: 0,
    totalVolumeUsd: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error("Failed to load activity ledger");
      const json = await res.json();
      setTrades(json.trades || []);
      setStats(json.stats || { totalTrades: 0, confirmedCount: 0, rejectedCount: 0, totalVolumeUsd: 0 });
    } catch (error) {
      console.error(error);
      toast.error("Error loading activity records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
          <PieChart size={14} />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">Activity Ledger</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-header text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Activity size={24} className="text-primary" />
            <span>Execution &amp; Audit Ledger</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete cryptographic audit trail of all tokenized stock swaps and deterministic guardrail interventions.
          </p>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="valence-card p-4">
          <span className="text-xs text-muted-foreground">Total Swap Volume</span>
          <p className="text-xl font-bold font-mono text-foreground mt-1">
            {formatCurrency(stats.totalVolumeUsd)}
          </p>
        </Card>
        <Card className="valence-card p-4">
          <span className="text-xs text-muted-foreground">Total Operations</span>
          <p className="text-xl font-bold font-mono text-foreground mt-1">
            {stats.totalTrades}
          </p>
        </Card>
        <Card className="valence-card p-4">
          <span className="text-xs text-muted-foreground">Confirmed Swaps</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {stats.confirmedCount}
          </p>
        </Card>
        <Card className="valence-card p-4">
          <span className="text-xs text-muted-foreground">Guardrail Interventions</span>
          <p className="text-xl font-bold font-mono text-destructive mt-1">
            {stats.rejectedCount}
          </p>
        </Card>
      </div>

      {/* Main Activity Table Card */}
      <Card className="valence-card border-border/80 shadow-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span>Historical Transactions &amp; Interventions</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Every trade execution references Robinhood Chain explorer. Interventions record pure guardrail reasons.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : (
            <ActivityTable trades={trades} onRefresh={fetchActivity} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
