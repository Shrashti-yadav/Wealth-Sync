import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Chatbot } from "@/components/chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "WealthSync",
  description: "AI-Powered Personal Finance Management Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>

        <body className={`${inter.className} bg-white dark:bg-gray-950`}>
          
          {/* Header */}
          <Header />

          {/* Main Content */}
          <main className="min-h-screen">
            {children}
          </main>

          {/* Global AI Chatbot */}
          <Chatbot />

          {/* Toast Notifications */}
          <Toaster richColors />

          {/* Footer */}
          <Footer />

        </body>
      </html>
    </ClerkProvider>
  );
}