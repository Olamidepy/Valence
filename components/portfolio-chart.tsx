"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  date: string;
  value: number;
  invested: number;
}

interface PortfolioChartProps {
  data: DataPoint[];
  height?: number;
}

export function PortfolioChart({ data, height = 280 }: PortfolioChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No portfolio history available yet.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="valenceChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4bac" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8a35b6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9e9aa4" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#9e9aa4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="#635f69"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#635f69"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DataPoint;
                const gain = item.value - item.invested;
                const gainPct = ((gain / item.invested) * 100).toFixed(1);

                return (
                  <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.date}
                    </p>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Portfolio Value:</span>
                        <span className="font-bold text-foreground font-mono">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Principal Invested:</span>
                        <span className="font-mono text-muted-foreground">
                          {formatCurrency(item.invested)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs border-t border-border/60 pt-1">
                        <span className="text-muted-foreground">Unrealized PnL:</span>
                        <span className="font-bold font-mono text-emerald-400">
                          +{formatCurrency(gain)} (+{gainPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="invested"
            stroke="#47444d"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#investedGradient)"
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#ef4bac"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#valenceChartGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PortfolioChart;
