"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Minus, ShoppingCart } from "lucide-react";

interface TicketType {
  id: string;
  name: string;
  price: number;
  description?: string | null;
}

interface BuyTicketsProps {
  eventId: string;
  eventName: string;
  ticketTypes: TicketType[];
}

export default function BuyTickets({ eventId, eventName, ticketTypes }: BuyTicketsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const totalAmount = ticketTypes.reduce((sum, tt) => {
    return sum + (tt.price * (quantities[tt.id] || 0));
  }, 0);

  const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleCheckout = async () => {
    if (totalQty === 0) return;
    
    setLoading(true);
    setError("");

    const items = Object.entries(quantities).map(([ticketTypeId, qty]) => ({
      ticketTypeId,
      qty,
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: session?.user?.name || "Attendee",
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");
      
      // Navigate to orders page upon success
      router.push("/orders");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (ticketTypes.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-muted-foreground">
          No tickets are currently available for this event.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-foreground">
        Purchase Tickets
      </h2>
      
      <div className="space-y-4">
        {ticketTypes.map((tt) => {
          const qty = quantities[tt.id] || 0;
          return (
            <div key={tt.id} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-foreground">{tt.name}</p>
                <p className="text-sm font-semibold mono mt-0.5 text-emerald-600 dark:text-emerald-400">
                  ${tt.price.toFixed(2)}
                </p>
                {tt.description && (
                  <p className="text-xs mt-1 text-muted-foreground">{tt.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleQtyChange(tt.id, -1)}
                  disabled={qty === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-50 transition-colors bg-accent text-muted-foreground hover:bg-accent/80"
                >
                  <Minus size={14} />
                </button>
                <span className="w-4 text-center text-sm font-medium text-foreground">
                  {qty}
                </span>
                <button 
                  onClick={() => handleQtyChange(tt.id, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalQty > 0 && (
        <div className="pt-4 mt-4 border-t border-border space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total ({totalQty} items)</span>
            <span className="text-lg font-bold mono text-emerald-600 dark:text-emerald-400">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              {error}
            </div>
          )}

          <button 
            onClick={handleCheckout} 
            disabled={loading} 
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Processing...</>
            ) : (
              <><ShoppingCart size={16} /> Checkout</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
