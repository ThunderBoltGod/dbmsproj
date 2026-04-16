// src/app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import Providers from "@/components/Providers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar user={{ ...session.user, role: session.user.role }} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        {/* AI Assistant — floating chat button, visible on all dashboard pages */}
        <AIAssistant />
      </div>
    </Providers>
  );
}
