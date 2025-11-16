import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { secretKey } = await request.json();

    if (!secretKey) {
      return NextResponse.json(
        { message: "Secret key is required" },
        { status: 400 }
      );
    }

    // Check if user exists with this secret key
    const { data: user, error: userError } = await supabase
      .from("fake_users")
      .select("id")
      .eq("secret_key", secretKey)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: "Invalid secret key" },
        { status: 401 }
      );
    }

    // Create JWT that lives for 30 years
    const token = jwt.sign(
      {
        userId: user.id,
        type: "anonymous",
      },
      process.env.JWT_SECRET || "your-fallback-secret-key-change-in-production",
      {
        expiresIn: "30y", // 30 years
      }
    );

    // Create session entry in fake_user_sessions
    const { error: sessionError } = await supabase
      .from("fake_user_sessions")
      .insert([
        {
          user_id: user.id,
          access_token: token,
          created_at: new Date().toISOString(),
        },
      ]);

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json(
        { message: "Failed to create session" },
        { status: 500 }
      );
    }

    // Return the token to be stored in localStorage
    return NextResponse.json({
      token: token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // For GET requests with body (from your layout), we need to parse differently
    let requestToken = token;

    // If no token in query params, try to get from request body (for layout compatibility)
    if (!requestToken) {
      try {
        const body = await request.json();
        requestToken = body.token;
      } catch (e) {
        // If no body or invalid JSON, continue with query param token (which might be null)
      }
    }

    if (!requestToken) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    // Check if token exists in fake_user_sessions
    const { data: session, error: sessionError } = await supabase
      .from("fake_user_sessions")
      .select("id, user_id, access_token, created_at")
      .eq("access_token", requestToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          message: "Invalid or expired token",
          valid: false,
        },
        { status: 401 }
      );
    }

    // Verify JWT is still valid
    try {
      jwt.verify(
        requestToken,
        process.env.JWT_SECRET ||
          "your-fallback-secret-key-change-in-production"
      );
    } catch (jwtError) {
      // If JWT is invalid, delete the session and return error
      await supabase
        .from("fake_user_sessions")
        .delete()
        .eq("access_token", requestToken);

      return NextResponse.json(
        {
          message: "Token expired",
          valid: false,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Token is valid",
      valid: true,
      userId: session.user_id,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        valid: false,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // For DELETE requests with body (from your layout), we need to parse differently
    let requestToken = token;

    // If no token in query params, try to get from request body
    if (!requestToken) {
      try {
        const body = await request.json();
        requestToken = body.token;
      } catch (e) {
        // If no body or invalid JSON, continue with query param token (which might be null)
      }
    }

    if (!requestToken) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    // Delete the session entry from fake_user_sessions
    const { error: deleteError } = await supabase
      .from("fake_user_sessions")
      .delete()
      .eq("access_token", requestToken);

    if (deleteError) {
      console.error("Session deletion error:", deleteError);
      return NextResponse.json(
        { message: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Logout successful",
      deleted: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
