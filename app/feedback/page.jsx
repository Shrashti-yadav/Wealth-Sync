"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Send, MessageSquareHeart, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// ── Star Rating Component ──────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Single Review Card ────────────────────────────────────────────────────
function ReviewCard({ review, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Avatar initials */}
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {review.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {review.name || "Anonymous"}
                </p>
                <p className="text-xs text-gray-400">
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </div>
            <StarRating value={review.rating} readonly />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {review.message}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const [form, setForm] = useState({ name: "", email: "", rating: 0, message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch existing reviews
  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch("/api/feedback");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReviews(data);
      } catch {
        // silently fail — reviews section just won't show
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, [submitted]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Please enter your name");
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      return toast.error("Please enter a valid email");
    if (form.rating === 0) return toast.error("Please select a rating");
    if (!form.message.trim()) return toast.error("Please write a message");

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setForm({ name: "", email: "", rating: 0, message: "" });
      toast.success("Thank you for your feedback!");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Average rating
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-16 space-y-16">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <MessageSquareHeart className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Share Your Feedback
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Help us improve WealthSync AI. Your honest feedback shapes what we build next.
          </p>

          {/* Live rating summary */}
          {avgRating && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <StarRating value={Math.round(Number(avgRating))} readonly />
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{avgRating}</span> avg
                from {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 gap-4 text-center"
                  >
                    <CheckCircle2 className="h-14 w-14 text-green-500" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Thank you!
                    </h2>
                    <p className="text-gray-500 max-w-sm">
                      Your feedback has been submitted. We read every response and use it to make WealthSync AI better.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                      className="mt-2"
                    >
                      Submit another response
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Name + Email */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          Your Name <span className="text-red-400">*</span>
                        </label>
                        <Input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Rahul Sharma"
                          disabled={submitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="rahul@example.com"
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Overall Rating <span className="text-red-400">*</span>
                      </label>
                      <StarRating
                        value={form.rating}
                        onChange={(val) =>
                          setForm((prev) => ({ ...prev, rating: val }))
                        }
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Your Message <span className="text-red-400">*</span>
                      </label>
                      <Textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="What do you love? What could be better?"
                        rows={4}
                        disabled={submitting}
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Reviews List ── */}
        {loadingReviews ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              What users are saying
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
