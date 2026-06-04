"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Minus, Bot, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { chatWithAI } from "@/actions/chatbot";
import useFetch from "@/hooks/use-fetch";

/* ---------------- QUICK SUGGESTIONS ---------------- */
const QUICK_SUGGESTIONS = [
  { emoji: "📊", label: "Summary" },
  { emoji: "💸", label: "Expenses" },
  { emoji: "📈", label: "Income" },
  { emoji: "🎯", label: "Budget" },
  { emoji: "💡", label: "Tips" },
];

/* ---------------- WELCOME CARDS ---------------- */
const WELCOME_CARDS = [
  { emoji: "📊", label: "This Month Summary" },
  { emoji: "💸", label: "Top Expenses" },
  { emoji: "🎯", label: "Budget Status" },
];

/* ---------------- FORMAT AI RESPONSE ---------------- */
function formatMessage(text) {
  if (!text) return "";

  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove **bold**
    .replace(/•/g, "\n•") // spacing bullets
    .replace(/\n{3,}/g, "\n\n"); // clean spacing
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const messagesEndRef = useRef(null);

  const {
    loading: isTyping,
    fn: sendMessageFn,
    data: aiResponse,
    error,
  } = useFetch(chatWithAI);

  /* ---------------- SCROLL ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ---------------- AI RESPONSE ---------------- */
  useEffect(() => {
    if (aiResponse?.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: formatMessage(aiResponse.data),
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [aiResponse]);

  /* ---------------- ERROR ---------------- */
  useEffect(() => {
    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "Something went wrong. Please try again 🙏",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [error]);

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = async (messageText) => {
    const text = messageText || inputValue;
    if (!text.trim() || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    setInputValue("");

    await sendMessageFn(text, updated);
  };

  const handleClearChat = () => setMessages([]);

  return (
    <>
      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 transition-all duration-300",
            "md:bottom-6 md:right-6 md:w-[560px]",
            isMinimized ? "md:h-16" : "md:h-[720px]"
          )}
        >
          <Card className="h-full flex flex-col shadow-2xl overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">WealthSync AI</h3>
                  <p className="text-xs text-white/80">Online</p>
                </div>
              </div>

              <div className="flex gap-2">
                {messages.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleClearChat}
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20"
                >
                  <Minus className="size-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">

                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">

                      <div className="text-6xl">🤖</div>

                      <div>
                        <h3 className="text-lg font-semibold">
                          Ask your financial assistant
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Try “Show expenses” or “Budget status”
                        </p>
                      </div>

                      {/* WELCOME CARDS */}
                      <div className="grid gap-3 w-full max-w-sm">
                        {WELCOME_CARDS.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(c.label)}
                            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border rounded-xl hover:shadow-md transition"
                          >
                            <span className="text-2xl">{c.emoji}</span>
                            <span className="text-sm font-medium">
                              {c.label}
                            </span>
                          </button>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-5">

                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "flex",
                            m.sender === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                              m.sender === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-gray-800 border text-gray-900 dark:text-gray-100"
                            )}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}

                      {isTyping && (
                        <div className="text-sm text-gray-500">
                          AI is thinking...
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* QUICK SUGGESTIONS */}
                {messages.length > 0 && (
                  <div className="px-4 py-2 border-t bg-white dark:bg-gray-950">
                    <div className="flex gap-2 overflow-x-auto">
                      {QUICK_SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(s.label)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded-full text-sm whitespace-nowrap"
                        >
                          <span>{s.emoji}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* INPUT */}
                <div className="p-4 border-t flex gap-2 bg-white dark:bg-gray-950">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    placeholder="Ask anything..."
                  />

                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    <Send className="size-4 text-white" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* FLOAT BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setIsOpen(true)}
            className="size-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl"
          >
            <Bot className="text-white size-6" />
          </Button>
        </div>
      )}
    </>
  );
}