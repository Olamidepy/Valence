"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AlertsSettingsPage() {
  const [inAppAlerts, setInAppAlerts] = useState<boolean>(true);
  const [guardrailAlerts, setGuardrailAlerts] = useState<boolean>(true);
  const [executionReceipts, setExecutionReceipts] = useState<boolean>(true);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean, label: string) => {
    setter(!current);
    toast.success(`${label} ${!current ? "enabled" : "disabled"}.`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">Notification Preferences</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-header text-3xl font-bold tracking-tight text-foreground">
            Notification Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure in-app transaction notifications and guardrail telemetry on Robinhood Chain L2.
          </p>
        </div>

        <Link href="/activity">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full">
            <Activity size={14} />
            <span>View Audit Ledger</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* In-App Alerts Configuration Card */}
        <Card className="valence-card border-border/80 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Bell size={18} />
                </div>
                <CardTitle className="text-base">In-App Notifications</CardTitle>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 gap-1 text-xs">
                <CheckCircle2 size={12} />
                Active
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Real-time browser notifications and toasts when vault orders execute on Robinhood Chain L2.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Execution Receipts
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Display toast receipts with transaction hash upon swap broadcast
                  </span>
                </div>
                <Button
                  variant={executionReceipts ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggle(setExecutionReceipts, executionReceipts, "Execution receipts")}
                  className="h-7 text-xs px-3 font-semibold"
                >
                  {executionReceipts ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Deterministic Guardrail Warnings
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Alert whenever slippage caps, oracle divergence, or concentration rules trigger
                  </span>
                </div>
                <Button
                  variant={guardrailAlerts ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggle(setGuardrailAlerts, guardrailAlerts, "Guardrail warnings")}
                  className="h-7 text-xs px-3 font-semibold"
                >
                  {guardrailAlerts ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Portfolio Rebalance Status
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Notification when weekly scheduled DCA completes
                  </span>
                </div>
                <Button
                  variant={inAppAlerts ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggle(setInAppAlerts, inAppAlerts, "Rebalance status")}
                  className="h-7 text-xs px-3 font-semibold"
                >
                  {inAppAlerts ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardrail Safety & Audit Ledger Card */}
        <Card className="valence-card border-border/80 shadow-2xl flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <CardTitle className="text-base">On-Chain Audit Trail</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Every portfolio transaction is permanently written to the public ledger with immutable mathematical proofs.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-[#121118] p-4 space-y-2 text-xs font-mono text-muted-foreground">
              <div className="flex items-center justify-between text-white">
                <span>Network:</span>
                <span className="text-emerald-400">Robinhood Chain L2</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Contract Router:</span>
                <span>UniversalRouter v4</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Allowance Protocol:</span>
                <span>Permit2 (Gasless)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Oracle Parity:</span>
                <span>Chainlink Feeds</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              No off-chain messengers are required. All trade actions and safety trims are immediately inspectable on the public activity ledger.
            </p>

            <Link href="/activity" className="inline-block w-full">
              <Button variant="outline" className="w-full gap-2 text-xs rounded-lg">
                <span>Inspect All Historical Transactions</span>
                <ArrowRight size={13} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
