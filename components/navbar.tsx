"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ValenceLogo } from "@/components/valence-logo";
import { WalletConnect } from "@/components/wallet-connect";
import Icon, { IconName } from "@/components/icon";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon?: IconName;
}

const DOCS_NAV_ITEMS: NavItem[] = [
  { label: "Architecture", href: "/#architecture" },
  { label: "Guardrails", href: "/#guardrails" },
  { label: "Token Registry", href: "/#registry" },
  { label: "Audit Proofs", href: "/#audit" },
  { label: "Documentation", href: "/#docs" },
];

const APP_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "chart-pie" },
  { label: "New Goal", href: "/goals/new", icon: "target" },
  { label: "Activity", href: "/activity", icon: "activity" },
  { label: "Guardrails", href: "/settings/guardrails", icon: "shield-check" },
  { label: "Protocol Revenue", href: "/admin", icon: "percent" },
];

export function Navbar() {
  const pathname = usePathname();
  const isMarketing = pathname === "/";
  const isAuthPage = pathname.startsWith("/auth");

  const navItems = isMarketing ? DOCS_NAV_ITEMS : APP_NAV_ITEMS;

  return (
    <div className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 pointer-events-none">
      <header className="mx-auto max-w-5xl rounded-full border border-white/10 bg-[#14121a]/85 backdrop-blur-2xl px-5 sm:px-6 py-2 flex items-center justify-between shadow-2xl shadow-black/80 pointer-events-auto transition-all">
        {/* Brand / Logo */}
        <Link href="/" className="group flex items-center hover:opacity-95 transition-opacity">
          <ValenceLogo size={22} />
        </Link>

        {/* Center Nav Links - Generous spacing, not packed together */}
        {!isAuthPage && (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href.startsWith("/#")
                  ? false
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-all duration-200",
                    isActive
                      ? "bg-white/15 text-white shadow-sm font-semibold"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {isMarketing ? (
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <button className="btn-hero-gradient px-4 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer">
                  <span>Launch App</span>
                  <span className="text-xs">↗</span>
                </button>
              </Link>
            </div>
          ) : isAuthPage ? (
            <Link
              href="/"
              className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
            >
              <span>Back to Overview</span>
              <span>&rarr;</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <WalletConnect />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Nav Bar */}
      {!isAuthPage && (
        <div className="md:hidden mt-2 mx-auto max-w-sm rounded-full border border-white/10 bg-[#14121a]/95 backdrop-blur-2xl px-3 py-1.5 flex items-center justify-around pointer-events-auto">
          {navItems.slice(0, 5).map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/#")
                ? false
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs transition-colors flex items-center gap-1",
                  isActive
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
                title={item.label}
              >
                {item.icon ? (
                  <Icon name={item.icon} size={15} />
                ) : (
                  <span className="text-[11px] font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Navbar;
