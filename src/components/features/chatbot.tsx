"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Loader2, Bot, User } from "lucide-react";
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-bg-secondary relative">
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
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                m.role === "user"
                  ? "bg-brand text-white rounded-tr-sm"
                  : "bg-bg-tertiary text-text-primary border border-border-default rounded-tl-sm"
              )}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {m.content}
              </div>
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex w-full gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <div className="px-4 py-3 text-sm text-text-tertiary">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border-default bg-bg-secondary rounded-b-xl">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-bg-tertiary border border-border-default rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-brand/50 transition-all"
        >
          <input
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary py-1"
            value={input}
            placeholder="Ask about going for a run..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-1.5 text-brand disabled:text-text-tertiary hover:bg-brand/10 rounded-full transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
