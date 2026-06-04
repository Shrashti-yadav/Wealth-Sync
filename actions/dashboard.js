"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };

  // ✅ Check for undefined not falsy (0 is valid amount)
  if (obj.balance !== undefined && obj.balance !== null) {
    serialized.balance = obj.balance.toNumber
      ? obj.balance.toNumber()
      : obj.balance;
  }

  if (obj.amount !== undefined && obj.amount !== null) {
    serialized.amount = obj.amount.toNumber
      ? obj.amount.toNumber()
      : obj.amount;
  }

  // ✅ Serialize Date objects to ISO strings
  if (obj.createdAt instanceof Date) {
    serialized.createdAt = obj.createdAt.toISOString();
  }
  if (obj.updatedAt instanceof Date) {
    serialized.updatedAt = obj.updatedAt.toISOString();
  }
  if (obj.date instanceof Date) {
    serialized.date = obj.date.toISOString();
  }
  if (obj.nextRecurringDate instanceof Date) {
    serialized.nextRecurringDate = obj.nextRecurringDate.toISOString();
  }
  if (obj.lastProcessed instanceof Date) {
    serialized.lastProcessed = obj.lastProcessed.toISOString();
  }

  return serialized;
};

export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return accounts.map(serializeTransaction);
  } catch (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
}

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const req = await request();

    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: { remaining, resetInSeconds: reset },
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) throw new Error("Invalid balance amount");

    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: serializeTransaction(account) };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    return transactions.map(serializeTransaction);
  } catch (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
}