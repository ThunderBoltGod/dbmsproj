"use client";
// src/app/(dashboard)/events/new/page.tsx

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, ImagePlus, X } from "lucide-react";
import AIDescriptionGenerator from "@/components/AIDescriptionGenerator";

interface OrgOption {
  id: string;
  name: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);

  const [form, setForm] = useState({
    entityName: "",
    bio:        "",
    orgId:      "",
    venueId:    "",
    status:     "draft" as "draft" | "published",
    startTime:  "",
    endTime:    "",
    capacity:   "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch organizations for dropdown
  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrgs(data.map((o: OrgOption) => ({ id: o.id, name: o.name })));
      })
      .catch(() => {});
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Upload image if present
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "Image upload failed");
        imageUrl = uploadData.url;
        setUploading(false);
      }

      // 2. Create event
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl,
          capacity: form.capacity ? parseInt(form.capacity) : undefined,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
          venueId: form.venueId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create event");
      router.push(`/events/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <Link href="/events" className="flex items-center gap-1.5 text-sm mb-4 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Events
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below. Use AI to write the description.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up">
        {/* Cover Image */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-foreground">Cover Image</h2>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-black/60 text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 py-12 transition-colors cursor-pointer text-muted-foreground hover:border-primary hover:text-primary bg-accent/50"
            >
              <ImagePlus size={32} />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Click to upload a cover image
                </p>
                <p className="text-xs mt-1">JPEG, PNG, WebP or GIF · Max 5MB</p>
              </div>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-foreground">Basic Info</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Event Name *
            </label>
            <input
              className="input"
              placeholder="e.g. Tech Summit 2025"
              value={form.entityName}
              onChange={(e) => update("entityName", e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              {form.entityName.length >= 3 && (
                <AIDescriptionGenerator
                  eventName={form.entityName}
                  onAccept={(text) => update("bio", text)}
                />
              )}
            </div>
            <textarea
              className="input"
              rows={4}
              placeholder="What is this event about? Who should attend?"
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Status
              </label>
              <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Capacity
              </label>
              <input className="input" type="number" placeholder="e.g. 300"
                value={form.capacity} onChange={(e) => update("capacity", e.target.value)} min={1} />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-foreground">Date & Time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">Start *</label>
              <input className="input" type="datetime-local" value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">End *</label>
              <input className="input" type="datetime-local" value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Organisation */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-foreground">Organisation</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Select Organisation *
            </label>
            {orgs.length > 0 ? (
              <select className="input" value={form.orgId} onChange={(e) => update("orgId", e.target.value)} required>
                <option value="">Choose an organisation...</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg px-4 py-3 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                No organisations found.{" "}
                <Link href="/organizations/new" className="underline font-medium text-primary">
                  Create one first
                </Link>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Venue ID <span className="text-muted-foreground">(optional)</span>
            </label>
            <input className="input" placeholder="Leave blank to add later"
              value={form.venueId} onChange={(e) => update("venueId", e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>{uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading image…</> : <><Loader2 size={15} className="animate-spin" /> Creating…</>}</>
            ) : (
              <><Calendar size={15} /> Create Event</>
            )}
          </button>
          <Link href="/events" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
