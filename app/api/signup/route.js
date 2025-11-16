import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST() {
  try {
    // Generate secret key
    const secretKey = randomBytes(32).toString("hex");

    // Insert into fake_users table
    const { data, error } = await supabase
      .from("fake_users")
      .insert([
        {
          secret_key: secretKey,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      );
    }

    // Return the secret key to the user
    return NextResponse.json({
      secret_key: secretKey,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
