"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, RefreshCw, StopCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { stopRecurringTransaction } from "@/actions/transaction";
import { toast } from "sonner";

export function TransactionList({ transactions }) {
  const router = useRouter();
  const [stoppingId, setStoppingId] = useState(null);

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  async function handleStop(transactionId) {
    setStoppingId(transactionId);
    try {
      await stopRecurringTransaction(transactionId);
      toast.success("Recurring transaction stopped.");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setStoppingId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recent.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No recent transactions
              </p>
            ) : (
              recent.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        transaction.type === "EXPENSE"
                          ? "bg-red-100 dark:bg-red-900/20"
                          : "bg-green-100 dark:bg-green-900/20"
                      )}
                    >
                      {transaction.type === "EXPENSE" ? (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {transaction.description || "Untitled"}
                        </p>
                        {transaction.isRecurring && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 text-xs px-1.5 py-0"
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            {transaction.recurringInterval}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {transaction.category} •{" "}
                        {format(new Date(transaction.date), "PP")}
                        {transaction.isRecurring && transaction.nextRecurringDate && (
                          <span className="ml-1 text-blue-400">
                            · Next: {format(new Date(transaction.nextRecurringDate), "PP")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        transaction.type === "EXPENSE"
                          ? "text-red-500"
                          : "text-green-500"
                      )}
                    >
                      {transaction.type === "EXPENSE" ? "-" : "+"}₹
                      {Number(transaction.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>

                    {transaction.isRecurring && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => handleStop(transaction.id)}
                        disabled={stoppingId === transaction.id}
                        title="Stop recurring"
                      >
                        {stoppingId === transaction.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <StopCircle className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}