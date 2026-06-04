"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart2,
  Receipt,
  PieChart,
  CreditCard,
  Zap,
  Bot,
} from "lucide-react";

// ✅ Features — Multi-Currency removed, AI Assistant added (matches real features)
const FEATURES = [
  {
    icon: BarChart2,
    title: "Advanced Analytics",
    description:
      "Get detailed insights into your spending patterns with AI-powered analytics",
  },
  {
    icon: Receipt,
    title: "Smart Receipt Scanner",
    description:
      "Extract data automatically from receipts using advanced AI technology",
  },
  {
    icon: PieChart,
    title: "Budget Planning",
    description:
      "Create and manage budgets with intelligent recommendations",
  },
  {
    icon: CreditCard,
    title: "Multi-Account Support",
    description:
      "Manage multiple accounts and credit cards in one place",
  },
  {
    icon: Bot,
    title: "AI Financial Assistant",
    description:
      "Chat with your personal AI assistant for instant financial guidance",
  },
  {
    icon: Zap,
    title: "Automated Insights",
    description:
      "Get automated financial insights and recommendations",
  },
];

// ✅ Stats fetched dynamically — no hardcoded fake numbers
function useStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats"); // your stats API route
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setStats(data);
      } catch {
        // fallback: hide stats section if unavailable
        setStats(null);
      }
    }
    fetchStats();
  }, []);

  return stats;
}

const HeroSection = () => {
  const imageRef = useRef(null);
  const stats = useStats();

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="pt-40 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
            Manage Your Finances <br /> with Intelligence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            An AI-powered financial management platform that helps you track,
            analyze, and optimize your spending with real-time insights.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="px-6 py-7 text-lg">
                Get Started
              </Button>
            </Link>
            {/* <Link href="https://www.youtube.com/roadsidecoder">
              <Button size="lg" variant="outline" className="px-8">
                Watch Demo
              </Button>
            </Link> */}
          </div>
          <div className="hero-image-wrapper mt-5 md:mt-0">
            <div ref={imageRef} className="hero-image">
              <Image
                src="/banner.jpeg"
                width={1280}
                height={720}
                alt="Dashboard Preview"
                className="rounded-lg shadow-2xl border mx-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Dynamic Stats ── */}
      {stats && (
        <section className="py-16 px-4 bg-blue-50">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.activeUsers && (
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.activeUsers}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Active Users</p>
                </div>
              )}
              {stats.transactionsTracked && (
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.transactionsTracked}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Transactions Tracked
                  </p>
                </div>
              )}
              {stats.uptime && (
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.uptime}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Uptime</p>
                </div>
              )}
              {stats.userRating && (
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.userRating}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">User Rating</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your finances
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-xl border bg-white hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-lg text-gray-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;