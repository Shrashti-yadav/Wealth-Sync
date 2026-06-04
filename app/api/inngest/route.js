import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processRecurringTransaction,
  triggerRecurringTransactions,
  generateMonthlyReports,
  checkBudgetAlerts,
} from "@/lib/inngest/function";
import aj from "@/lib/arcjet";
import { NextResponse } from "next/server";

const { GET, POST: inngestPOST, PUT } = serve({
  client: inngest,
  functions: [
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    checkBudgetAlerts,
  ],
});

export { GET, PUT };

export async function POST(req) {
  const decision = await aj.protect(req, { userId: "inngest" });
  if (decision.isDenied()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return inngestPOST(req);
}