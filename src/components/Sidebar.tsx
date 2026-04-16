"use client";
// src/components/Sidebar.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Calendar, Ticket, Users, ShoppingCart,
  ClipboardList, Bell, BarChart3, Building2, Settings, LogOut, Shield
} from "lucide-react";
import { canAccess, getRoleLabel, getRoleBadgeColor } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import ThemeToggle from "@/components/ThemeToggle";

// Each nav item has a minimum role required to see it
const NAV = [
  { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard, minRole: "attendee" as UserRole },
  { label: "Events",        href: "/events",         icon: Calendar,        minRole: "attendee" as UserRole },
  { label: "Tickets",       href: "/tickets",        icon: Ticket,          minRole: "attendee" as UserRole },
  { label: "Orders",        href: "/orders",         icon: ShoppingCart,    minRole: "attendee" as UserRole },
  { label: "Volunteers",    href: "/volunteers",     icon: Users,           minRole: "admin" as UserRole },
  { label: "Tasks",         href: "/tasks",          icon: ClipboardList,   minRole: "volunteer" as UserRole },
  { label: "Notifications", href: "/notifications",  icon: Bell,            minRole: "attendee" as UserRole },
  { label: "Analytics",     href: "/analytics",      icon: BarChart3,       minRole: "organizer" as UserRole },
  { label: "User Management", href: "/users",        icon: Shield,          minRole: "super_admin" as UserRole },
];

const BOTTOM_NAV = [
  { label: "Organizations", href: "/organizations",  icon: Building2, minRole: "admin" as UserRole },
  { label: "Settings",      href: "/settings",       icon: Settings,  minRole: "attendee" as UserRole },
];

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
}

export default function Sidebar({ user }: Props) {
  const path = usePathname();
  const userRole = (user?.role || "attendee") as UserRole;
  const badgeColor = getRoleBadgeColor(userRole);

  // Filter nav items based on user's role
  const visibleNav = NAV.filter((item) => canAccess(userRole, item.minRole));
  const visibleBottomNav = BOTTOM_NAV.filter((item) => canAccess(userRole, item.minRole));

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-card border-r border-border">

      {/* ── Logo ───────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
          <span className="text-sm font-bold">E</span>
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-foreground">EventHub</span>
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Management
          </div>
        </div>
      </div>

      {/* ── Main nav ───────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Navigation
        </p>
        {visibleNav.map(({ label, href, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`nav-item relative ${active ? "active" : ""}`}>
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              <Icon size={16} className={active ? "" : "opacity-60"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ─────────────────────── */}
      <div className="px-3 py-3 space-y-0.5 border-t border-border">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Account
        </p>
        {visibleBottomNav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className={`nav-item ${path.startsWith(href) ? "active" : ""}`}>
            <Icon size={16} className="opacity-60" />
            {label}
          </Link>
        ))}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User card */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-accent">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full object-cover border-2 border-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary border-2 border-primary/20">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              {/* Online dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">
                {user?.name ?? "User"}
              </p>
              {/* Role badge */}
              <div className="flex items-center gap-1 mt-0.5">
                <Shield size={9} style={{ color: badgeColor.text }} />
                <span className="text-[10px] font-medium" style={{ color: badgeColor.text }}>
                  {getRoleLabel(userRole)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="nav-item w-full text-left group text-red-500 dark:text-red-400 hover:text-red-600 mt-1"
            id="sidebar-signout"
          >
            <LogOut size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
