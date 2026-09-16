"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Loader2, Bot, User, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotProps {
  context: {
    userName: string;
    ageGroup: string;
    conditions: string;
    districtName: string;
    aqi: number;
    pm25: number | null;
  };
}

export function Chatbot({ context }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);

  const chatOptions = {
    api: "/api/chat",
    body: {
      data: {
        context,
      },
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `Hi ${context.userName.split(" ")[0]}! I'm your AI Health Advisor. The AQI in ${context.districtName} is ${context.aqi}. How can I help you safely plan your day?`,
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat(chatOptions as any) as any;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] max-h-[calc(100vh-120px)] flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in-0">
          <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-white">AI Health Advisor</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {messages?.map((m: any) => (
              <div
                key={m.id}
                className={cn(
                  "flex w-full gap-3",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    m.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm"
                      : "bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-sm"
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {m.content}
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="px-4 py-3 text-sm text-slate-400">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all"
            >
              <input
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-400 py-1"
                value={input}
                placeholder="Ask about going for a run..."
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-1.5 text-cyan-400 disabled:text-slate-500 hover:bg-cyan-500/20 rounded-full transition-colors shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/20 transition-all hover:scale-110",
          "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
          !isOpen && "hover:animate-pulse" // Pulsing hover effect when closed
        )}
        aria-label="Toggle AI Advisor"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
