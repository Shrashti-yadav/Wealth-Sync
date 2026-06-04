import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET all feedback
export async function GET() {
  try {
    const feedbacks = await db.feedback.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        rating: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("GET /api/feedback error:", error);

    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// POST feedback
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, rating, message } = body;

    // Validation
    if (!name || !email || !rating || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Logged-in user required
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Please login to submit feedback" },
        { status: 401 }
      );
    }

    // Find user in DB
    const user = await db.user.findUnique({
      where: {
        clerkUserId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check existing feedback
    const existingFeedback = await db.feedback.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        {
          error: "You have already submitted feedback.",
        },
        {
          status: 409,
        }
      );
    }

    // Create feedback
    const feedback = await db.feedback.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rating: Number(rating),
        message: message.trim(),
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: feedback.id,
        message: "Feedback submitted successfully",
      },
      {
        status: 201,
      }
    );
   }catch (error) {
  console.error("POST /api/feedback error:", error);

  if (error?.code === "P2002") {
    return NextResponse.json(
      {
        error: "You have already submitted feedback.",
      },
      {
        status: 409,
      }
    );
  }

  return NextResponse.json(
    {
      error: error?.message || "Failed to submit feedback",
    },
    {
      status: 500,
    }
  );
}}