"use client";

import React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "p-4 rounded-lg shadow-elevated border flex items-start gap-3 animate-slide-up bg-bg-secondary",
            toast.variant === "success" && "border-success text-success-text",
            toast.variant === "error" && "border-error text-error-text",
            toast.variant === "warning" && "border-warning text-warning-text",
            toast.variant === "default" && "border-border-default text-text-primary"
          )}
        >
          <div className="shrink-0 mt-0.5">
            {toast.variant === "success" && <CheckCircle className="h-5 w-5 text-success" />}
            {toast.variant === "error" && <AlertCircle className="h-5 w-5 text-error" />}
            {toast.variant === "warning" && <AlertTriangle className="h-5 w-5 text-warning" />}
            {toast.variant === "default" && <Info className="h-5 w-5 text-brand" />}
          </div>
          <div className="flex-1 text-sm">
            {toast.title && <h4 className="font-semibold mb-1">{toast.title}</h4>}
            <p className="opacity-90">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
