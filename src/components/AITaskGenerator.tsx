"use client";
// src/components/AITaskGenerator.tsx
// Shows Claude's suggested task list for an event, with a "Save to tasks" button.

import { useState } from "react";
import { Lightbulb, CheckCircle, Loader2, Save } from "lucide-react";

interface GeneratedTask {
  title:           string;
  description:     string;
  priority:        "low" | "medium" | "high" | "urgent";
  category:        string;
  daysBeforeEvent: number;
}

interface Props {
  eventId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
  high:   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  medium: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  low:    "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10",
};

const CATEGORY_EMOJI: Record<string, string> = {
  logistics:   "📦",
  marketing:   "📣",
  volunteers:  "🙋",
  operations:  "⚙️",
  "post-event": "📋",
};

export default function AITaskGenerator({ eventId }: Props) {
  const [tasks, setTasks]       = useState<GeneratedTask[]>([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res  = await fetch("/api/ai/generate-tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId, saveTasks: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(data.tasks ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate tasks");
    } finally {
      setLoading(false);
    }
  }

  async function saveToTasks() {
    setSaving(true);
    try {
      await fetch("/api/ai/generate-tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId, saveTasks: true }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-500/10">
            <Lightbulb size={14} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Task Suggestions
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && !saved && (
            <button
              onClick={saveToTasks}
              disabled={saving}
              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
            >
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              {saving ? "Saving…" : "Save all to tasks"}
            </button>
          )}
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={13} /> Saved!
            </span>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {loading ? (
              <><Loader2 size={11} className="animate-spin" /> Generating…</>
            ) : tasks.length > 0 ? "Regenerate" : (
              <><Lightbulb size={11} /> Generate Tasks</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-3 py-2 text-xs mb-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {tasks.length === 0 && !loading && (
        <p className="text-sm text-center py-4 text-muted-foreground">
          Click &quot;Generate Tasks&quot; to create a complete task checklist for this event.
        </p>
      )}

      {loading && (
        <div className="space-y-2.5 py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg p-3 bg-accent">
              <div className="h-3.5 rounded w-2/3 mb-2 skeleton" />
              <div className="h-2.5 rounded w-full skeleton" />
            </div>
          ))}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div key={i} className="rounded-lg p-3 bg-accent border border-border">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{CATEGORY_EMOJI[task.category] ?? "📌"}</span>
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-xs ml-6 text-muted-foreground">
                {task.description}
              </p>
              <p className="text-[10px] ml-6 mt-1.5 text-muted-foreground/60">
                {task.daysBeforeEvent > 0
                  ? `${task.daysBeforeEvent} days before event`
                  : task.daysBeforeEvent === 0
                  ? "Day of event"
                  : `${Math.abs(task.daysBeforeEvent)} days after event`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
