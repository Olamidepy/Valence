"use client";

import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, PieChart, SlidersHorizontal, Lock, Database, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export interface GuardrailSettings {
  maxHoldingWeightPct: number;
  maxSlippageBps: number;
  maxOraclePremiumBps: number;
  minPoolLiquidityUsd: number;
}

interface GuardrailSlidersProps {
  initialConfig: GuardrailSettings;
  onSave?: (config: GuardrailSettings) => Promise<void>;
}

export function GuardrailSliders({ initialConfig, onSave }: GuardrailSlidersProps) {
  const [config, setConfig] = useState<GuardrailSettings>(initialConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleChange = (key: keyof GuardrailSettings, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setHasUnsavedChanges(false);
    toast.info("Reverted to active guardrail configuration.");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(config);
      } else {
        const res = await fetch("/api/settings/guardrails", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error("Failed to save guardrail limits");
      }

      setHasUnsavedChanges(false);
      toast.success("Deterministic guardrail limits saved successfully!");
    } catch (error) {
      toast.error((error as Error).message || "Error saving guardrails");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informational Callout: AI proposes, deterministic code disposes */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3.5 backdrop-blur-sm">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-primary">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h4 className="font-header text-sm font-bold text-foreground">
            Deterministic Execution Protocol
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            The AI only proposes investment ideas. Deterministic code disposes. Every swap proposal
            must strictly satisfy these hard bounds before any transaction touches Robinhood Chain.
            Violations are automatically trimmed or blocked.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Guardrail 1: Max Holding Weight */}
        <Card className="valence-card border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart size={16} className="text-primary" />
                Max Weight Per Holding
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs font-bold text-foreground bg-secondary/80">
                {config.maxHoldingWeightPct}%
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Prevents single-asset concentration. Holdings above this ceiling are auto-trimmed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={[config.maxHoldingWeightPct]}
              min={15}
              max={60}
              step={1}
              onValueChange={([val]) => handleChange("maxHoldingWeightPct", val)}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>15% (Ultra-Diversified)</span>
              <span>35% (Recommended)</span>
              <span>60% (Concentrated)</span>
            </div>
          </CardContent>
        </Card>

        {/* Guardrail 2: Max Slippage */}
        <Card className="valence-card border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" />
                Max Allowable Slippage
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs font-bold text-foreground bg-secondary/80">
                {config.maxSlippageBps} bps ({(config.maxSlippageBps / 100).toFixed(2)}%)
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Strict limit on execution price drift during swap routing on UniversalRouter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={[config.maxSlippageBps]}
              min={10}
              max={150}
              step={5}
              onValueChange={([val]) => handleChange("maxSlippageBps", val)}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>10 bps (0.10%)</span>
              <span>50 bps (0.50%)</span>
              <span>150 bps (1.50%)</span>
            </div>
          </CardContent>
        </Card>

        {/* Guardrail 3: Max Oracle Premium */}
        <Card className="valence-card border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock size={16} className="text-primary" />
                Max Chainlink Oracle Premium
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs font-bold text-foreground bg-secondary/80">
                {config.maxOraclePremiumBps} bps ({(config.maxOraclePremiumBps / 100).toFixed(2)}%)
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Rejects trades if pool spot price deviates higher than Chainlink reference price.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={[config.maxOraclePremiumBps]}
              min={25}
              max={250}
              step={5}
              onValueChange={([val]) => handleChange("maxOraclePremiumBps", val)}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>25 bps (0.25%)</span>
              <span>100 bps (1.00%)</span>
              <span>250 bps (2.50%)</span>
            </div>
          </CardContent>
        </Card>

        {/* Guardrail 4: Minimum Pool Liquidity */}
        <Card className="valence-card border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database size={16} className="text-primary" />
                Minimum Pool Depth
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs font-bold text-foreground bg-secondary/80">
                ${(config.minPoolLiquidityUsd / 1000).toFixed(0)}k USD
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Blocks trades in low-liquidity tokenized pairs to guarantee smooth fills.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={[config.minPoolLiquidityUsd]}
              min={50000}
              max={1000000}
              step={25000}
              onValueChange={([val]) => handleChange("minPoolLiquidityUsd", val)}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span>$50,000</span>
              <span>$250,000 (Default)</span>
              <span>$1,000,000</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explicit Save Action Bar (No silent auto-save) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <Badge variant="warning" className="gap-1 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
              Unsaved changes pending
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
              <Check size={12} className="text-emerald-400" />
              Configuration synced
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasUnsavedChanges || isSaving}
            className="text-xs"
          >
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="gap-1.5 text-xs font-semibold"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Limits...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Save Guardrail Limits</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GuardrailSliders;
