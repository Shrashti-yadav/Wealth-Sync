import React from "react";
import { Button } from "@/components/ui/button";
import {
  PenBox,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";

const Header = async () => {
  await checkUser();

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="absolute inset-0 border-b border-border/50 bg-white/80 shadow-sm backdrop-blur-xl dark:bg-gray-950/80" />

      <nav className="relative container mx-auto flex items-center justify-between px-8 py-5">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="WealthSync Logo"
            width={220}
            height={60}
            className="h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Signed Out Navigation (Landing Page Links) */}
        <SignedOut>
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">

            <a
              href="/#features"
              className="rounded-lg px-5 py-2.5 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Features
            </a>

            <a
              href="/#how-it-works"
              className="rounded-lg px-5 py-2.5 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              How it Works
            </a>

            <a
              href="/#testimonials"
              className="rounded-lg px-5 py-2.5 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Testimonials
            </a>

          </div>
        </SignedOut>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          <SignedIn>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-foreground px-7 py-7"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="hidden md:inline text-lg">
                  Dashboard
                </span>
              </Button>
            </Link>

            <Link href="/feedback">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-foreground px-7 py-7"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="hidden md:inline text-lg">
                  Feedback
                </span>
              </Button>
            </Link>

            <Link href="/transaction/create">
              <Button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-base font-semibold text-white shadow-md hover:from-blue-700 hover:to-purple-700 hover:shadow-lg">
                <PenBox className="h-5 w-5" />
                <span className="hidden md:inline text-lg">
                  Add Transaction
                </span>
              </Button>
            </Link>

            <div className="mx-2 h-8 w-px bg-border" />

            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-11 h-11 ring-2 ring-border hover:ring-primary/50 transition-all duration-200 rounded-full",
                },
              }}
            />
          </SignedIn>

          <SignedOut>

            <SignInButton forceRedirectUrl="/dashboard">
              <Button
                variant="outline"
                className="hidden md:flex rounded-full px-6 py-5 text-base font-medium"
              >
                Login
              </Button>
            </SignInButton>

            <SignInButton forceRedirectUrl="/dashboard">
              <Button className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-base font-semibold text-white shadow-md hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </SignInButton>

          </SignedOut>

        </div>
      </nav>
    </header>
  );
};

export default Header;