"use client";
// src/components/AIInsights.tsx
// Fetches a Claude-generated natural-language summary of your platform analytics.

import { useState, useEffect } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";

interface Props {
  eventId?: string; // omit for platform-wide insights
}

export default function AIInsights({ eventId }: Props) {
  const [insights, setInsights]   = useState<string>("");
  const [loading, setLoading]     = useState(false);
  const [generatedAt, setGenAt]   = useState<string>("");

  async function fetchInsights() {
    setLoading(true);
    try {
      const url = eventId
        ? `/api/ai/insights?event=${eventId}`
        : "/api/ai/insights";
      const res  = await fetch(url);
      const data = await res.json();
      setInsights(data.insights ?? "");
      setGenAt(data.generatedAt ?? "");
    } catch {
      setInsights("Failed to load insights.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on mount
  useEffect(() => { fetchInsights(); }, [eventId]);

  // Split into bullet lines for clean rendering
  const lines = insights.split("\n").filter((l) => l.trim());

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-500/10">
            <Lightbulb size={14} className="text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Insights
          </span>
        </div>
        <div className="flex items-center gap-2">
          {generatedAt && (
            <span className="text-[10px] text-muted-foreground/60">
              {new Date(generatedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="btn-ghost p-1.5 rounded-lg"
          >
            <RefreshCw size={13} className={`${loading ? "animate-spin" : ""} text-muted-foreground`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 rounded-md skeleton"
              style={{ width: `${75 + Math.random() * 20}%` }} />
          ))}
        </div>
      ) : insights ? (
        <div className="space-y-2">
          {lines.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No insights yet — click refresh to generate.
        </p>
      )}
    </div>
  );
}
