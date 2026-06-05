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
  // Explicitly supply the production signing key
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

export { GET, PUT };

export async function POST(req) {
  // 1. Check if the request is an internal Inngest sync action or execution
  // Inngest requests include a signature or special headers.
  const isInngestRequest = 
    req.headers.has("x-inngest-signature") || 
    req.headers.has("x-inngest-sdk");

  // 2. Only run Arcjet protection if it's NOT an Inngest system request
  if (!isInngestRequest) {
    const decision = await aj.protect(req, { userId: "inngest" });
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 3. Hand off the request to the Inngest serve engine
  return inngestPOST(req);
}
