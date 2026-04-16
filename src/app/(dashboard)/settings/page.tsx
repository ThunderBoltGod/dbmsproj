// src/app/(dashboard)/settings/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleLabel, getRoleBadgeColor } from "@/lib/roles";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, phone: true, role: true, status: true, image: true, createdAt: true },
  });

  const roleLabel = getRoleLabel(user?.role || "attendee");
  const badgeColor = getRoleBadgeColor(user?.role || "attendee");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Profile card */}
      <div className="card animate-fade-up">
        <h2 className="font-semibold mb-5 text-foreground">Profile</h2>
        <form action="/api/settings/profile" method="POST" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Full name
              </label>
              <input className="input" name="name" defaultValue={user?.name} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Phone
              </label>
              <input className="input" name="phone" defaultValue={user?.phone ?? ""} placeholder="+1 555 0000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Email <span className="text-xs font-normal text-muted-foreground">(managed by Google)</span>
            </label>
            <input className="input" type="email" value={user?.email} disabled
              style={{ opacity: 0.5, cursor: "not-allowed" }} />
          </div>
          <div className="pt-2">
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>
      </div>

      {/* Authentication */}
      <div className="card animate-fade-up">
        <h2 className="font-semibold mb-4 text-foreground">Authentication</h2>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Google Account</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <span className="badge badge-active text-[10px]">Connected</span>
        </div>
        <p className="text-xs mt-3 text-muted-foreground">
          Your account is authenticated via Google. Password management is not required.
        </p>
      </div>

      {/* Account info */}
      <div className="card animate-fade-up">
        <h2 className="font-semibold mb-4 text-foreground">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ background: badgeColor.bg, color: badgeColor.text, border: `1px solid ${badgeColor.border}` }}>
              {roleLabel}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={`badge badge-${user?.status}`}>{user?.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="text-foreground">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" }) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{session?.user.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
