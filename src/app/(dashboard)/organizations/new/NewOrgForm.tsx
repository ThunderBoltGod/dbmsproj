"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

export default function NewOrgForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create organization");
      router.push("/organizations");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="animate-fade-up">
        <Link href="/organizations" className="flex items-center gap-1.5 text-sm mb-4"
          style={{ color: "hsl(215 20% 55%)" }}>
          <ArrowLeft size={14} /> Back to Organizations
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(210 40% 96%)" }}>New Organization</h1>
        <p className="mt-1 text-sm" style={{ color: "hsl(215 20% 55%)" }}>
          Create an organization to start hosting events.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up">
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(210 40% 96%)" }}>
              Organization Name *
            </label>
            <input className="input" placeholder="e.g. TechEvents Inc."
              value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(210 40% 96%)" }}>
              Contact Email *
            </label>
            <input className="input" type="email" placeholder="org@example.com"
              value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(210 40% 96%)" }}>
              Phone <span style={{ color: "hsl(215 20% 45%)" }}>(optional)</span>
            </label>
            <input className="input" placeholder="+1 555 0000"
              value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 70%)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Creating…</>
            ) : (
              <><Building2 size={15} /> Create Organization</>
            )}
          </button>
          <Link href="/organizations" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
