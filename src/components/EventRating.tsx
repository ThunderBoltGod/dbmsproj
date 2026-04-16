"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  rating: number | null;
  comments: string | null;
  submittedAt: string;
  user: { name: string; image: string | null };
}

interface EventRatingProps {
  eventId: string;
  myRating: number | null;       // current user's existing rating
  myComments: string | null;     // current user's existing comment
  avgRating: number;             // average across all reviews
  totalReviews: number;
  reviews: Review[];             // recent reviews to display
}

export default function EventRating({
  eventId, myRating, myComments, avgRating, totalReviews, reviews,
}: EventRatingProps) {
  const router = useRouter();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(myRating || 0);
  const [comments, setComments] = useState(myComments || "");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(!!myRating);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (selectedRating === 0) {
      setError("Please select a rating");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          rating: selectedRating,
          comments: comments || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");

      setSubmitted(true);
      setShowForm(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const displayRating = hoveredStar || selectedRating;

  return (
    <div className="card space-y-5">
      {/* Header with average */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            Ratings & Reviews
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  fill={star <= Math.round(avgRating) ? "rgb(234 179 8)" : "transparent"}
                  stroke={star <= Math.round(avgRating) ? "rgb(234 179 8)" : "currentColor"}
                  className={star <= Math.round(avgRating) ? "" : "text-border"}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
            </span>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-outline text-sm"
          >
            <Star size={14} /> {submitted ? "Edit Review" : "Write Review"}
          </button>
        )}
      </div>

      {/* Submit/Edit form */}
      {showForm && (
        <div className="p-4 rounded-xl space-y-4 animate-fade-up bg-accent border border-border">
          {/* Star selector */}
          <div>
            <p className="text-xs font-medium mb-2 text-foreground">
              Your Rating
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedRating(star)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    size={28}
                    fill={star <= displayRating ? "rgb(234 179 8)" : "transparent"}
                    stroke={star <= displayRating ? "rgb(234 179 8)" : "currentColor"}
                    className={`transition-colors ${star <= displayRating ? "" : "text-border"}`}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="text-sm font-medium ml-2 text-yellow-600 dark:text-yellow-400">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground">
              Your Review <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Share your experience at this event..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-xs bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={handleSubmit} disabled={loading} className="btn-primary text-sm">
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Submitting...</>
              ) : (
                <><Star size={14} /> {submitted ? "Update Review" : "Submit Review"}</>
              )}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="space-y-4 pt-2">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-primary/10 text-primary">
                {review.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  review.user.name?.[0] || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {review.user.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={10}
                        fill={star <= (review.rating || 0) ? "rgb(234 179 8)" : "transparent"}
                        stroke={star <= (review.rating || 0) ? "rgb(234 179 8)" : "currentColor"}
                        className={star <= (review.rating || 0) ? "" : "text-border"}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground/60">
                    {new Date(review.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comments && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {review.comments}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 && !showForm && (
        <div className="text-center py-4">
          <MessageSquare size={24} className="mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      )}
    </div>
  );
}
