import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    // First, get all questions with their reply counts
    const { data: allQuestions, error: fetchError } = await supabase.from(
      "questions"
    ).select(`
        *,
        replies (
          id
        )
      `);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { message: "Failed to fetch questions", error: fetchError.message },
        { status: 500 }
      );
    }

    // Calculate reply counts for all questions and format properly
    const questionsWithCounts = allQuestions.map((question) => ({
      ...question,
      reply_count: question.replies?.length || 0,
      // Remove the replies array to avoid confusion
      replies: undefined,
    }));

    // Apply search filter
    let filteredQuestions = questionsWithCounts;
    if (search.trim()) {
      filteredQuestions = questionsWithCounts.filter(
        (question) =>
          question.title.toLowerCase().includes(search.toLowerCase()) ||
          (question.keywords &&
            question.keywords.some((keyword) =>
              keyword.toLowerCase().includes(search.toLowerCase())
            ))
      );
    }

    // Apply sorting
    let sortedQuestions = [...filteredQuestions];
    switch (sort) {
      case "oldest":
        sortedQuestions.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "most_replies":
        sortedQuestions.sort((a, b) => b.reply_count - a.reply_count);
        break;
      case "newest":
      default:
        sortedQuestions.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
    }

    // Apply pagination
    const totalCount = sortedQuestions.length;
    const paginatedQuestions = sortedQuestions.slice(offset, offset + limit);

    return NextResponse.json({
      questions: paginatedQuestions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: totalCount > offset + limit,
        totalCount: totalCount,
      },
    });
  } catch (error) {
    console.error("Questions API error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
