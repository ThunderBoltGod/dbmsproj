"use client";
// src/components/AIDescriptionGenerator.tsx
// A self-contained widget that generates event descriptions using Claude.
// Drop this into the event creation/edit form.

import { useState } from "react";
import { Lightbulb, Loader2, Copy, Check } from "lucide-react";

interface Props {
  eventName:    string;
  onAccept:     (text: string) => void; // called when user clicks "Use this"
}

export default function AIDescriptionGenerator({ eventName, onAccept }: Props) {
  const [open, setOpen]           = useState(false);
  const [eventType, setEventType] = useState("");
  const [highlights, setHighlights] = useState("");
  const [tone, setTone]           = useState<"professional" | "casual" | "exciting" | "formal">("professional");
  const [result, setResult]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);

  async function generate() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/generate-description", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventName, eventType, highlights, tone }),
      });
      const data = await res.json();
      setResult(data.description ?? "");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium transition-colors text-primary hover:text-primary/80"
      >
        <Lightbulb size={12} />
        Generate with AI
      </button>
    );
  }

  return (
    <div className="rounded-xl p-4 space-y-3 mt-2 bg-accent border border-border">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={13} className="text-primary" />
        <span className="text-xs font-semibold text-primary">
          Description Generator
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1 text-muted-foreground">
            Event type (optional)
          </label>
          <input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="input text-xs py-2"
            placeholder="e.g. tech conference, charity gala"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-muted-foreground">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as typeof tone)}
            className="input text-xs py-2"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="exciting">Exciting</option>
            <option value="formal">Formal</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1 text-muted-foreground">
          Key highlights (optional)
        </label>
        <input
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          className="input text-xs py-2"
          placeholder="e.g. 3 keynote speakers, live music, networking lunch"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="btn-primary text-xs py-1.5 px-3"
        >
          {loading ? <><Loader2 size={11} className="animate-spin" /> Generating…</> : <><Lightbulb size={11} /> Generate</>}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-ghost text-xs py-1.5 px-3"
        >
          Cancel
        </button>
      </div>

      {result && (
        <div className="rounded-lg p-3 relative bg-background border border-border">
          <p className="text-sm leading-relaxed pr-6 text-muted-foreground">
            {result}
          </p>
          <button
            type="button"
            onClick={copy}
            className="absolute top-2 right-2 p-1 rounded text-muted-foreground"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => { onAccept(result); setOpen(false); }}
              className="btn-primary text-xs py-1.5 px-3"
            >
              ✓ Use this
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="btn-ghost text-xs py-1.5 px-3"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
