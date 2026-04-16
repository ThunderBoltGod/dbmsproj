"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, X, Ticket } from "lucide-react";

interface TicketTypeData {
  id: string;
  name: string;
  price: number;
  maxQuantity: number | null;
  _count?: { orderItems: number };
}

interface TicketTypeManagerProps {
  eventId: string;
}

export default function TicketTypeManager({ eventId }: TicketTypeManagerProps) {
  const [ticketTypes, setTicketTypes] = useState<TicketTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formMaxQty, setFormMaxQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTicketTypes();
  }, [eventId]);

  async function fetchTicketTypes() {
    try {
      const res = await fetch(`/api/events/${eventId}/ticket-types`);
      const data = await res.json();
      if (Array.isArray(data)) setTicketTypes(data);
    } catch {
      setError("Failed to load ticket types");
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingId(null);
    setFormName("");
    setFormPrice("");
    setFormMaxQty("");
    setShowForm(true);
    setError("");
  }

  function openEditForm(tt: TicketTypeData) {
    setEditingId(tt.id);
    setFormName(tt.name);
    setFormPrice(tt.price.toString());
    setFormMaxQty(tt.maxQuantity?.toString() || "");
    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  async function handleSave() {
    if (!formName.trim()) { setError("Name is required"); return; }
    if (!formPrice || isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      setError("Valid price is required"); return;
    }

    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: formName.trim(),
      price: Number(formPrice),
      maxQuantity: formMaxQty ? parseInt(formMaxQty) : null,
    };

    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/events/${eventId}/ticket-types`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketTypeId: editingId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Update failed");
        setTicketTypes((prev) => prev.map((t) => t.id === editingId ? { ...t, ...data } : t));
      } else {
        // Create
        const res = await fetch(`/api/events/${eventId}/ticket-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Create failed");
        setTicketTypes((prev) => [...prev, data]);
      }
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ticket type? This cannot be undone.")) return;
    setDeleting(id);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/ticket-types`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketTypeId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setTicketTypes((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 rounded-full animate-spin border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">
          Ticket Types <span className="text-sm font-normal text-muted-foreground">({ticketTypes.length})</span>
        </h2>
        {!showForm && (
          <button onClick={openAddForm} className="btn-primary text-sm">
            <Plus size={14} /> Add Type
          </button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="p-4 rounded-xl space-y-3 animate-fade-up bg-accent border border-border">
          <p className="text-xs font-semibold text-primary">
            {editingId ? "Edit Ticket Type" : "New Ticket Type"}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground">Name *</label>
              <input className="input text-sm" placeholder="e.g. VIP" value={formName}
                onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground">Price ($) *</label>
              <input className="input text-sm" type="number" step="0.01" min="0" placeholder="0.00"
                value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground">
                Max Qty <span className="text-muted-foreground">(opt)</span>
              </label>
              <input className="input text-sm" type="number" min="1" placeholder="Unlimited"
                value={formMaxQty} onChange={(e) => setFormMaxQty(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> {editingId ? "Update" : "Add"}</>}
            </button>
            <button onClick={closeForm} className="btn-ghost text-sm"><X size={14} /> Cancel</button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg px-3 py-2 text-xs bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
          {error}
        </div>
      )}

      {/* Ticket types list */}
      {ticketTypes.length === 0 && !showForm ? (
        <div className="text-center py-6">
          <Ticket size={28} className="mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No ticket types yet</p>
          <p className="text-xs mt-1 text-muted-foreground/60">Add one to start selling tickets</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ticketTypes.map((tt) => {
            const sold = tt._count?.orderItems || 0;
            return (
              <div key={tt.id} className="flex items-center justify-between p-3 rounded-lg transition-colors bg-accent">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Ticket size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{tt.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{sold} sold</span>
                      {tt.maxQuantity && (
                        <>
                          <span>·</span>
                          <span>{tt.maxQuantity - sold} remaining</span>
                        </>
                      )}
                      {!tt.maxQuantity && <><span>·</span><span>Unlimited</span></>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold mono text-emerald-600 dark:text-emerald-400">
                    ${tt.price.toFixed(2)}
                  </span>
                  <button onClick={() => openEditForm(tt)} className="p-1.5 rounded-lg transition-colors text-muted-foreground hover:bg-background hover:text-foreground"
                    title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(tt.id)} disabled={deleting === tt.id}
                    className="p-1.5 rounded-lg transition-colors text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    title="Delete">
                    {deleting === tt.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
