import React from "react";
import { GoalForm } from "@/components/goal-form";
import Link from "next/link";
import { PieChart } from "lucide-react";

export const metadata = {
  title: "Create Goal — Valence",
  description: "Set up an automated investing goal with SERV reasoning on Robinhood Chain.",
};

export default function NewGoalPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Breadcrumb / Back Link */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
          <PieChart size={14} />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">New Investment Goal</span>
      </div>

      <GoalForm />
    </div>
  );
}
