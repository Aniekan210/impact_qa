"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok && data.secret_key) {
        setSecretKey(data.secret_key);
        setShowModal(true);
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (error) {
      setError("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    router.push("/login");
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
            Join Anonymous Q&A
          </CardTitle>
          <CardDescription className="text-[#6B6B6B] text-base leading-relaxed">
            Create your anonymous account to start asking and answering
            questions in the community led by{" "}
            <span className="font-semibold text-[#81462C]">
              Impact Fellowship
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSignup} className="space-y-5">
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
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create Anonymous Account
                </div>
              )}
            </Button>

            <div className="text-center pt-5 border-t border-[#E5E5E5]">
              <p className="text-sm text-[#6B6B6B]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold hover:underline transition-all duration-200 text-[#FA5200] hover:text-[#81462C]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Secret Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 relative">
                  <Image
                    src="/impact-logo.png"
                    alt="Impact Fellowship"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                  Impact Fellowship
                </h3>
              </div>

              <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
                Your Secret Key
              </h2>
              <p className="text-[#6B6B6B] mb-5 leading-relaxed">
                Save this key securely. You'll need it to access your account.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
                <p className="text-sm text-[#941004] opacity-85 font-medium">
                  ⚠️ <strong>Warning:</strong> This secret key cannot be
                  recovered if lost. Keep it safe!
                </p>
              </div>

              <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between space-x-3">
                  <code className="text-sm font-mono text-[#1A1A1A] break-all flex-1 text-left">
                    {secretKey}
                  </code>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    className="flex-shrink-0 h-9 px-3 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#FEA001] to-[#FA5200] hover:from-[#FA5200] hover:to-[#FEA001] text-white font-medium"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {copied && (
                <p className="text-green-600 text-sm mb-4 font-medium animate-in fade-in">
                  ✓ Copied to clipboard!
                </p>
              )}

              <Button
                onClick={handleModalClose}
                className="w-full h-11 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-[#FEA001] to-[#FA5200] hover:from-[#FA5200] hover:to-[#FEA001] hover:shadow-lg text-white"
              >
                I've Saved My Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
