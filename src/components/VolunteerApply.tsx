"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandHeart, Loader2, CheckCircle, XCircle } from "lucide-react";

interface VolunteerApplyProps {
  eventId: string;
  eventName: string;
  existingStatus: string | null; // null = hasn't applied, "pending" | "approved" | "rejected" | "withdrawn"
}

export default function VolunteerApply({ eventId, eventName, existingStatus }: VolunteerApplyProps) {
  const router = useRouter();
  const [status, setStatus] = useState(existingStatus);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, notes: notes || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit application");

      setStatus("pending");
      setShowForm(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Already applied — show status
  if (status) {
    const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
      pending: { icon: Loader2, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", label: "Application Pending" },
      approved: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", label: "Application Approved!" },
      rejected: { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", label: "Application Not Accepted" },
      withdrawn: { icon: XCircle, color: "text-muted-foreground", bg: "bg-accent", label: "Application Withdrawn" },
    };

    const cfg = statusConfig[status] || statusConfig.pending;
    const Icon = cfg.icon;

    return (
      <div className="card">
        <div className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
            <Icon size={20} className={status === "pending" ? "animate-spin" : ""} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-muted-foreground">
              {status === "pending" && "We'll notify you when your application is reviewed."}
              {status === "approved" && "You're confirmed as a volunteer for this event!"}
              {status === "rejected" && "Unfortunately, your application was not selected."}
              {status === "withdrawn" && "You withdrew your application."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not applied yet
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
          <HandHeart size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">Volunteer for this Event</h3>
          <p className="text-xs text-muted-foreground">
            Help make {eventName} a success!
          </p>
        </div>
      </div>

      {showForm ? (
        <div className="space-y-3 animate-fade-up">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground">
              Why do you want to volunteer? <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Share your skills, availability, or motivation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-xs bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={handleApply} disabled={loading} className="btn-primary text-sm">
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Submitting...</>
              ) : (
                <><HandHeart size={14} /> Submit Application</>
              )}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-primary w-full justify-center">
          <HandHeart size={16} /> Apply to Volunteer
        </button>
      )}
    </div>
  );
}
