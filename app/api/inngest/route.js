export const dynamic = "force-dynamic";

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  checkBudgetAlerts,
  generateMonthlyReports,
  processRecurringTransaction,
  triggerRecurringTransactions,
} from "@/lib/inngest/function";

export const { GET, POST, PUT } = serve({
  client: inngest,
  // 👇 THIS EXPLICITLY BINDS THE PRODUCTION KEY TO THE DISCOVERY HANDSHAKE
  signingKey: process.env.INNGEST_SIGNING_KEY, 
  functions: [
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    checkBudgetAlerts,
  ],
});
