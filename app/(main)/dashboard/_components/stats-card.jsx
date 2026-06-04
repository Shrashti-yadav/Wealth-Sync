"use client";

import { motion } from "motion/react";
import { Wallet, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ✅ Icon map — DollarSign replaced with IndianRupee
const ICONS = {
  Wallet,
  TrendingUp,
  TrendingDown,
  IndianRupee,
};

export function StatsCard({ title, value, change, changeType, icon, delay = 0 }) {
  // ✅ Resolve icon from string
  const Icon = ICONS[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            {Icon && (
              <div className="p-2 rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            <p
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-green-500",
                changeType === "negative" && "text-red-500",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}