"use client";
// src/app/(auth)/login/page.tsx

import { signIn } from "next-auth/react";
import { Calendar, Users, BarChart3, Ticket } from "lucide-react";

const FEATURES = [
  { icon: Calendar, label: "Event Management", desc: "Create and publish events in minutes" },
  { icon: Ticket,   label: "Ticketing",        desc: "Real-time sales and QR check-in" },
  { icon: Users,    label: "Volunteer Ops",     desc: "Manage shifts and applications" },
  { icon: BarChart3,label: "Analytics",         desc: "Revenue, attendance, and insights" },
];

export default function LoginPage() {
  function handleGoogleSignIn() {
    signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left panel: feature preview ───────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden p-12 bg-card border-r border-border">

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-16">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
            <span className="text-base font-bold">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">EventHub</span>
        </div>

        {/* Headline */}
        <div className="relative mb-12">
          <h1 className="text-4xl font-bold leading-tight mb-4 text-foreground" style={{ letterSpacing: "-0.03em" }}>
            Manage your<br />
            <span className="text-primary">events with ease</span>
          </h1>
          <p className="text-base text-muted-foreground">
            The all-in-one platform for ticketing, volunteers, and real-time analytics.
          </p>
        </div>

        {/* Feature tiles */}
        <div className="relative space-y-3">
          {FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="flex items-center gap-4 p-4 rounded-xl animate-fade-up bg-background border border-border"
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                <Icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: login ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 lg:max-w-md items-center justify-center p-8 relative">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
            <span className="text-sm font-bold">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">EventHub</span>
        </div>

        <div className="w-full max-w-sm animate-slide-in-right">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-1.5 text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your events
            </p>
          </div>

          <div className="card mb-2">
            <div className="space-y-4">
              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group bg-accent text-foreground border border-border hover:border-primary/30"
                id="login-google"
              >
                {/* Google "G" icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="transition-transform group-hover:translate-x-0.5">
                  Continue with Google
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">SECURE LOGIN</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Info text */}
              <p className="text-xs text-center leading-relaxed text-muted-foreground">
                Sign in with your Google account to get started.<br />
                New users are automatically registered on first sign-in.
              </p>
            </div>
          </div>

          {/* Role info */}
          <div className="mt-6 p-4 rounded-xl bg-accent border border-border">
            <p className="text-xs font-semibold mb-2 text-muted-foreground">ROLE-BASED ACCESS</p>
            <div className="space-y-1.5">
              {[
                { role: "Super Admin", color: "text-red-500 dark:text-red-400" },
                { role: "Admin", color: "text-purple-500 dark:text-purple-400" },
                { role: "Organizer", color: "text-blue-500 dark:text-blue-400" },
                { role: "Volunteer", color: "text-emerald-500 dark:text-emerald-400" },
                { role: "Attendee", color: "text-gray-500 dark:text-gray-400" },
              ].map(({ role, color }) => (
                <div key={role} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
                  <span className={`text-xs ${color}`}>{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
