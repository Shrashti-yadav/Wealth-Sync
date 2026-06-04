"use client";

import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    event.stopPropagation(); // ✅ stops bubbling to Link
    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }
    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 h-full",
          "hover:shadow-lg border border-border"
        )}
      >
        {/* ✅ Switch OUTSIDE Link to prevent navigation */}
        <div
          className="absolute top-4 right-4 z-10"
          onClick={(e) => e.preventDefault()}
        >
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
          />
        </div>

        {/* ✅ Link wraps only the content */}
        <Link href={`/account/${id}`} className="flex flex-col h-full">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between pt-5 pb-3 px-5 pr-16">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold capitalize">
                  {name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {type.charAt(0) + type.slice(1).toLowerCase()} Account
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Divider */}
          <div className="mx-5 border-t border-border/60" />

          {/* Balance */}
          <CardContent className="px-5 py-4 flex-1">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Current Balance
              </p>
              <div className="text-2xl font-bold tracking-tight">
                {formatINR(parseFloat(balance))}
              </div>
            </div>

            {isDefault && (
              <span className="inline-flex items-center mt-3 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                ⭐ Default Account
              </span>
            )}
          </CardContent>

          {/* Divider */}
          <div className="mx-5 border-t border-border/60" />

          {/* Footer */}
          <CardFooter className="px-5 py-3 flex justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
              <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Income
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                Expense
              </span>
            </div>
          </CardFooter>
        </Link>
      </Card>
    </motion.div>
  );
}