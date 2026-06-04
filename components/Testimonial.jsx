"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Testimonials() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await fetch("/api/feedback");
        const data = await res.json();

        if (Array.isArray(data)) {
          setFeedbacks(data);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  if (loading) return null;

  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">
          What Our Users Say
        </h2>

        {feedbacks.length === 0 ? (
          <p className="text-center text-gray-500">
            No feedback available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id} className="p-6">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {feedback.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {new Date(
                          feedback.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex">
                      {[...Array(feedback.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-600">
                    {feedback.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}