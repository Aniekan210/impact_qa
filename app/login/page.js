"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [secretKey, setSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        router.push("/user/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-[#E5E5E5] rounded-lg">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 relative">
              <Image
                src="/impact-logo.png"
                alt="Impact Fellowship"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Impact Fellowship
            </CardTitle>
          </div>
          <CardTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-[#6B6B6B] text-base leading-relaxed">
            Enter your secret key to access your anonymous account
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-3">
              <label
                htmlFor="secretKey"
                className="text-sm font-semibold text-[#1A1A1A] block"
              >
                Secret Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
                <Input
                  id="secretKey"
                  type={showPassword ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your secret key"
                  required
                  className="pl-10 pr-12 h-11 border-[#E5E5E5] focus:border-[#FA5200] focus:ring-2 focus:ring-[#FA5200]/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] hover:text-[#FA5200] transition-colors duration-200 p-1 rounded disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[#941004] opacity-85 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 relative overflow-hidden transition-all duration-300 rounded-lg font-semibold text-white bg-gradient-to-r from-[#FEA001] to-[#FA5200] hover:from-[#FA5200] hover:to-[#FEA001] hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </div>
              )}
            </Button>

            <div className="text-center pt-5 border-t border-[#E5E5E5]">
              <p className="text-sm text-[#6B6B6B]">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold hover:underline transition-all duration-200 text-[#FA5200] hover:text-[#81462C]"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
