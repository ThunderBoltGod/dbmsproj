// src/app/(dashboard)/organizations/new/page.tsx
// Server wrapper to prevent static prerendering
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/roles";
import { redirect } from "next/navigation";
import NewOrgForm from "./NewOrgForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Organization" };

export default async function NewOrgPage() {
  const session = await auth();
  if (!session || !canAccess(session.user.role, "admin")) redirect("/dashboard");
  return <NewOrgForm />;
}
