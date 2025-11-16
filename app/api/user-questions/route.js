import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, page = 1, limit = 6 } = body;
    const offset = (page - 1) * limit;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication token is required" },
        { status: 401 }
      );
    }

    // Verify the token and get user info
    let userId;
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "your-fallback-secret-key-change-in-production"
      );
      userId = decoded.userId;
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Check if user session is valid
    const { data: session, error: sessionError } = await supabase
      .from("fake_user_sessions")
      .select("user_id")
      .eq("access_token", token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    // Get total count of questions
    const { count: totalCount, error: countError } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("created_by_id", userId);

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { message: "Failed to count questions" },
        { status: 500 }
      );
    }

    // Fetch questions created by this user with pagination
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select(
        `
        *,
        replies:replies(count)
      `
      )
      .eq("created_by_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (questionsError) {
      console.error("User questions fetch error:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch user questions" },
        { status: 500 }
      );
    }

    // Format the response to include reply counts
    const formattedQuestions =
      questions?.map((question) => ({
        ...question,
        reply_count: question.replies?.[0]?.count || 0,
      })) || [];

    const hasMore = offset + limit < totalCount;

    return NextResponse.json({
      questions: formattedQuestions,
      hasMore,
      total: totalCount || 0,
    });
  } catch (error) {
    console.error("User questions error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
