import React from "react";
import {
  Wallet,
  PieChart,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  SlidersHorizontal,
  Bell,
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
  Clock,
  Calendar,
  DollarSign,
  Send,
  Target,
  Sparkles,
  Filter,
  Search,
  Lock,
  Info,
  Plus,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  Database,
  Percent,
  User,
  Menu,
  Settings,
  LucideProps,
  LucideIcon,
} from "lucide-react";

export type IconName =
  | "wallet"
  | "chart-pie"
  | "chart-line"
  | "shield-check"
  | "sliders"
  | "bell"
  | "activity"
  | "arrow-right"
  | "arrow-up-right"
  | "arrow-down-right"
  | "check"
  | "check-circle"
  | "alert-circle"
  | "alert-triangle"
  | "external-link"
  | "copy"
  | "refresh"
  | "clock"
  | "calendar"
  | "dollar-sign"
  | "telegram"
  | "target"
  | "sparkles"
  | "filter"
  | "search"
  | "lock"
  | "info"
  | "plus"
  | "x"
  | "layers"
  | "chevron-down"
  | "chevron-right"
  | "database"
  | "percent"
  | "user"
  | "menu"
  | "settings"
  | "trending-up"
  | "trending-down"
  | "google"
  | "apple";

const LUCIDE_ICON_MAP: Partial<Record<IconName, LucideIcon>> = {
  wallet: Wallet,
  "chart-pie": PieChart,
  "chart-line": TrendingUp,
  "shield-check": ShieldCheck,
  sliders: SlidersHorizontal,
  bell: Bell,
  activity: Activity,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "arrow-down-right": ArrowDownRight,
  check: Check,
  "check-circle": CheckCircle2,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "external-link": ExternalLink,
  copy: Copy,
  refresh: RefreshCw,
  clock: Clock,
  calendar: Calendar,
  "dollar-sign": DollarSign,
  telegram: Send,
  target: Target,
  sparkles: Sparkles,
  filter: Filter,
  search: Search,
  lock: Lock,
  info: Info,
  plus: Plus,
  x: X,
  layers: Layers,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  database: Database,
  percent: Percent,
  user: User,
  menu: Menu,
  settings: Settings,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
};

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  name: IconName;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 18,
  className = "",
  strokeWidth = 2,
  ...props
}: IconProps) {
  const IconComponent = LUCIDE_ICON_MAP[name];
  const numSize = typeof size === "string" ? parseInt(size, 10) || 18 : size;

  if (IconComponent) {
    return (
      <IconComponent
        size={numSize}
        strokeWidth={strokeWidth}
        className={`inline-block shrink-0 align-middle ${className}`}
        {...(props as LucideProps)}
      />
    );
  }

  // Fallback for special brand glyphs
  if (name === "google") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={numSize}
        height={numSize}
        className={`inline-block shrink-0 align-middle ${className}`}
        fill="currentColor"
        {...props}
      >
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    );
  }

  if (name === "apple") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={numSize}
        height={numSize}
        className={`inline-block shrink-0 align-middle ${className}`}
        fill="currentColor"
        {...props}
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24" />
      </svg>
    );
  }

  return null;
}

export default Icon;

// Re-export popular Lucide icons directly for convenient direct imports
export {
  Wallet,
  PieChart,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  SlidersHorizontal,
  Bell,
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
  Clock,
  Calendar,
  DollarSign,
  Send,
  Target,
  Sparkles,
  Filter,
  Search,
  Lock,
  Info,
  Plus,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  Database,
  Percent,
  User,
  Menu,
  Settings,
};
