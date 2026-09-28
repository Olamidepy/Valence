"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { GuardrailSliders, GuardrailSettings } from "@/components/guardrail-sliders";
import { PieChart, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function GuardrailSettingsPage() {
  const [config, setConfig] = useState<GuardrailSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchGuardrails = async () => {
    try {
      const res = await fetch("/api/settings/guardrails");
      if (!res.ok) throw new Error("Failed to load guardrails");
      const json = await res.json();
      setConfig(json.config);
    } catch (error) {
      console.error(error);
      toast.error("Error loading guardrail limits");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardrails();
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
        <span className="text-foreground font-semibold">Guardrail Controls</span>
      </div>

      <div>
        <h1 className="font-header text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShieldCheck size={24} className="text-primary" />
          <span>Deterministic Guardrails</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Define strict mathematical safety parameters that pure code enforces against SERV proposals.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        </div>
      ) : config ? (
        <GuardrailSliders initialConfig={config} />
      ) : (
        <div className="p-8 text-center text-sm text-destructive">
          Failed to load guardrail parameters.
        </div>
      )}
    </div>
  );
}
