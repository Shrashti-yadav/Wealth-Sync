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

// 👇 We explicitly define the signingKey right here inside the serve object
const { GET, POST: inngestPOST, PUT } = serve({
  client: inngest,
  signingKey: process.env.INNGEST_SIGNING_KEY, 
  functions: [
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
    checkBudgetAlerts,
  ],
});

export { GET, PUT };

export async function POST(req) {
  const url = new URL(req.url);
  
  // Skip Arcjet firewall checking for Inngest automated cloud systems
  const isInngest = 
    req.headers.has("x-inngest-signature") || 
    req.headers.has("x-inngest-sdk") ||
    url.searchParams.has("introspect");

  if (!isInngest) {
    const decision = await aj.protect(req, { userId: "inngest" });
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return inngestPOST(req);
}
