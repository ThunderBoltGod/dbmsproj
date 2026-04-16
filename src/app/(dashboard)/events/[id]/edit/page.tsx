"use client";
// src/app/(dashboard)/events/[id]/edit/page.tsx

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, ImagePlus, X, Trash2 } from "lucide-react";
import TicketTypeManager from "@/components/TicketTypeManager";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    entityName: "",
    bio: "",
    imageUrl: "",
    status: "draft",
    startTime: "",
    endTime: "",
    capacity: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  // Load event data
  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((event) => {
        setForm({
          entityName: event.entityName || "",
          bio: event.bio || "",
          imageUrl: event.imageUrl || "",
          status: event.status || "draft",
          startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : "",
          endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "",
          capacity: event.capacity?.toString() || "",
        });
        if (event.imageUrl) setImagePreview(event.imageUrl);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load event");
        setLoading(false);
      });
  }, [id]);

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
    setNewImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function removeImage() {
    setNewImageFile(null);
    setImagePreview(null);
    setForm((f) => ({ ...f, imageUrl: "" }));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      let imageUrl = form.imageUrl;

      // Upload new image if selected
      if (newImageFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", newImageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "Image upload failed");
        imageUrl = uploadData.url;
        setUploading(false);
      }

      // If image was removed, set to null
      const imageValue = imagePreview ? imageUrl : null;

      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityName: form.entityName,
          bio: form.bio || undefined,
          imageUrl: imageValue,
          status: form.status,
          startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
          endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
          capacity: form.capacity ? parseInt(form.capacity) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update event");
      router.push(`/events/${id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="animate-fade-up">
        <Link href={`/events/${id}`} className="flex items-center gap-1.5 text-sm mb-4 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update event details and cover image.
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
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-black/60 text-white hover:bg-black/80"
                  title="Change image"
                >
                  <ImagePlus size={14} />
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-red-500/80 text-white hover:bg-red-500"
                  title="Remove image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
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
            <input className="input" value={form.entityName}
              onChange={(e) => update("entityName", e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Description
            </label>
            <textarea className="input" rows={4} value={form.bio}
              onChange={(e) => update("bio", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Status
              </label>
              <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Capacity
              </label>
              <input className="input" type="number" value={form.capacity}
                onChange={(e) => update("capacity", e.target.value)} min={1} />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-foreground">Date & Time</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">Start</label>
              <input className="input" type="datetime-local" value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">End</label>
              <input className="input" type="datetime-local" value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Ticket Types */}
        <TicketTypeManager eventId={id} />

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <>{uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><Loader2 size={15} className="animate-spin" /> Saving…</>}</>
            ) : (
              <><Save size={15} /> Save Changes</>
            )}
          </button>
          <Link href={`/events/${id}`} className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
