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

    // Get distinct parent_question_ids from user's replies
    const { data: distinctReplies, error: distinctError } = await supabase
      .from("replies")
      .select("parent_question_id")
      .eq("created_by_id", userId)
      .not("parent_question_id", "is", null);

    if (distinctError) {
      console.error("Distinct replies error:", distinctError);
      return NextResponse.json(
        { message: "Failed to fetch user replies" },
        { status: 500 }
      );
    }

    // If no replies, return empty array
    if (!distinctReplies || distinctReplies.length === 0) {
      return NextResponse.json({
        questions: [],
        hasMore: false,
        total: 0,
      });
    }

    // Get unique question IDs
    const uniqueQuestionIds = [
      ...new Set(distinctReplies.map((reply) => reply.parent_question_id)),
    ];

    const totalCount = uniqueQuestionIds.length;

    // Get paginated subset of unique question IDs
    const paginatedQuestionIds = uniqueQuestionIds.slice(
      offset,
      offset + limit
    );

    // Fetch the questions for the paginated IDs
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select(
        `
        *,
        replies:replies(count)
      `
      )
      .in("id", paginatedQuestionIds)
      .order("created_at", { ascending: false });

    if (questionsError) {
      console.error("Questions fetch error:", questionsError);
      return NextResponse.json(
        { message: "Failed to fetch questions" },
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
      total: totalCount,
    });
  } catch (error) {
    console.error("User replies error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
