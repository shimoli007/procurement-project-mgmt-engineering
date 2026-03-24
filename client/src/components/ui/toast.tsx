import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

let toastCounter = 0;

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { id, message, variant }]);

      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return {
    toast: context.addToast,
    toasts: context.toasts,
    dismiss: context.removeToast,
  };
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
  error: "border-destructive bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
  info: "border-border bg-background text-foreground",
};

function ToastViewport({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-center justify-between rounded-lg border p-4 shadow-lg transition-all",
            variantStyles[toast.variant]
          )}
          role="alert"
        >
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            className="ml-4 inline-flex shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => removeToast(toast.id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export { ToastProvider, useToast };
export type { Toast, ToastVariant };
