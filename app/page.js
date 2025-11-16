// app/page.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/user/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#FEA001] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#6B6B6B]">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
