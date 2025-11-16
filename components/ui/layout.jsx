"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function Layout({ children }) {
  const [token, setToken] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVerifiedToken, setHasVerifiedToken] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const getActiveView = () => {
    if (pathname?.includes("/user/feed")) return "feed";
    if (pathname?.includes("/user/dashboard")) return "dashboard";
    return "dashboard";
  };

  const activeView = getActiveView();

  useEffect(() => {
    // Only verify token once on initial load
    if (hasVerifiedToken) return;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/login?token=${encodeURIComponent(storedToken)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setToken(storedToken);
            setHasVerifiedToken(true);
            if (pathname === "/login" || pathname === "/") {
              router.push("/user/dashboard");
            }
          } else {
            throw new Error("Invalid token");
          }
        } else {
          throw new Error("Token verification failed");
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.removeItem("token");
        setToken(null);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [router, pathname, hasVerifiedToken]);

  const handleSignOut = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      router.push("/login");
      return;
    }

    try {
      await fetch(`/api/login?token=${encodeURIComponent(currentToken)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setHasVerifiedToken(false);
      setIsMobileMenuOpen(false);
      router.push("/login");
    }
  };

  const handleViewChange = (view) => {
    setIsMobileMenuOpen(false);
    if (view === "feed") {
      router.push("/user/feed");
    } else if (view === "dashboard") {
      router.push("/user/dashboard");
    }
  };

  // Desktop Navigation Items
  const DesktopNavigation = () => (
    <div className="flex items-center space-x-8">
      <button
        onClick={() => handleViewChange("feed")}
        className={`relative px-2 py-1 text-lg font-medium transition-all duration-300 ${
          activeView === "feed"
            ? "text-[#FA5200]"
            : "text-[#6B6B6B] hover:text-[#1A1A1A]"
        }`}
      >
        Feed
        {activeView === "feed" && (
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FA5200] transform origin-left transition-all duration-300" />
        )}
      </button>

      {/* Vertical separator */}
      <div className="h-6 w-px bg-[#E5E5E5]" />

      <button
        onClick={() => handleViewChange("dashboard")}
        className={`relative px-2 py-1 text-lg font-medium transition-all duration-300 ${
          activeView === "dashboard"
            ? "text-[#FA5200]"
            : "text-[#6B6B6B] hover:text-[#1A1A1A]"
        }`}
      >
        Dashboard
        {activeView === "dashboard" && (
          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FA5200] transform origin-left transition-all duration-300" />
        )}
      </button>
    </div>
  );

  // Mobile Navigation Items - Minimalistic
  const MobileNavigation = () => (
    <div className="flex flex-col space-y-1 py-2">
      <button
        onClick={() => handleViewChange("feed")}
        className={`text-left px-4 py-3 text-base font-medium transition-colors duration-200 ${
          activeView === "feed"
            ? "text-[#FA5200]"
            : "text-[#6B6B6B] hover:text-[#1A1A1A]"
        }`}
      >
        Feed
      </button>

      <button
        onClick={() => handleViewChange("dashboard")}
        className={`text-left px-4 py-3 text-base font-medium transition-colors duration-200 ${
          activeView === "dashboard"
            ? "text-[#FA5200]"
            : "text-[#6B6B6B] hover:text-[#1A1A1A]"
        }`}
      >
        Dashboard
      </button>

      {/* Mobile Sign Out - Simple divider */}
      <div className="border-t border-[#E5E5E5] my-2" />

      <button
        onClick={handleSignOut}
        className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-[#FA5200] hover:text-[#F37501] transition-colors duration-200"
      >
        <LogOut size={18} />
        <span>Sign Out</span>
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FEA001] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B6B6B]">Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img
                  src="/impact-logo.png"
                  alt="Impact Fellowship"
                  className="w-8 h-8 rounded"
                />
                <span className="text-xl font-semibold text-[#1A1A1A]">
                  Impact Fellowship
                </span>
              </div>
            </div>

            {/* Centered Desktop Navigation */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
              <DesktopNavigation />
            </div>

            {/* Desktop Sign Out - Right Side */}
            <div className="hidden md:flex items-center">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-[#FA5200] hover:text-[#F37501] transition-colors duration-200"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#1A1A1A] hover:text-[#FA5200] transition-colors duration-200"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Clean and Minimal */}
        <div
          className={`
          md:hidden bg-white border-t border-[#E5E5E5] overflow-hidden transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}
        `}
        >
          <MobileNavigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
