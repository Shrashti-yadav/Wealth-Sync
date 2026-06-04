"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// FIX: safer Prisma Decimal handling
const serializeAmount = (obj) => {
  if (!obj) return obj;

  return {
    ...obj,
    amount: obj.amount ? Number(obj.amount) : 0,
  };
};

/* ---------------- CREATE TRANSACTION ---------------- */
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      throw new Error("Too many requests. Please try again later.");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) throw new Error("Account not found");

    const balanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const newBalance = Number(account.balance) + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return created;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

/* ---------------- GET TRANSACTION ---------------- */
export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

/* ---------------- UPDATE TRANSACTION ---------------- */
export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const original = await db.transaction.findUnique({
      where: { id, userId: user.id },
    });

    if (!original) throw new Error("Transaction not found");

    const oldChange =
      original.type === "EXPENSE"
        ? -Number(original.amount)
        : Number(original.amount);

    const newChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netChange = newChange - oldChange;

    const updated = await db.$transaction(async (tx) => {
      const t = await tx.transaction.update({
        where: { id, userId: user.id },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netChange,
          },
        },
      });

      return t;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(updated) };
  } catch (error) {
    throw new Error(error.message);
  }
}

/* ---------------- GET USER TRANSACTIONS ---------------- */
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

/* ---------------- SCAN RECEIPT (FIXED GEMINI) ---------------- */
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // FIXED (your old model was invalid)
    });

    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
Extract receipt data and return ONLY JSON:
{
  "amount": number,
  "date": "ISO string",
  "description": "string",
  "merchantName": "string",
  "category": "string"
}
If not a receipt return {}.
`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();

    const data = JSON.parse(cleaned);

    return {
      amount: Number(data.amount || 0),
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description || "",
      category: data.category || "other-expense",
      merchantName: data.merchantName || "",
    };
  } catch (error) {
    console.error("scanReceipt error:", error);
    throw new Error("Failed to scan receipt");
  }
}

/* ---------------- HELPER ---------------- */
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

// /* ---------------- STOP RECURRING TRANSACTION ---------------- */
// export async function stopRecurringTransaction(transactionId) {
//   try {
//     console.log("Stopping transaction:", transactionId);
//     const { userId } = await auth();
//     if (!userId) throw new Error("Unauthorized");

//     const user = await db.user.findUnique({
//       where: { clerkUserId: userId },  // ✅ matches your pattern
//     });

//     if (!user) throw new Error("User not found");

//     await db.transaction.update({
//       where: {
//         id: transactionId,
//         userId: user.id,  // ✅ uses user.id not clerkUserId
//       },
//       data: {
//         isRecurring: false,
//         recurringInterval: null,
//         nextRecurringDate: null,
//       },
//     });

//     revalidatePath("/dashboard");
//     return { success: true };
//   } catch (error) {
//     throw new Error(error.message);
//   }
// }

/* ---------------- STOP RECURRING TRANSACTION ---------------- */
export async function stopRecurringTransaction(transactionId) {
  try {
    console.log("Stopping transaction:", transactionId);
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    await db.transaction.update({
      where: {
        id: transactionId,
        userId: user.id,
      },
      data: {
        isRecurring: false,
        recurringInterval: null,
        nextRecurringDate: null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/");           // ← add this
    revalidatePath("/transaction"); // ← add this
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
}