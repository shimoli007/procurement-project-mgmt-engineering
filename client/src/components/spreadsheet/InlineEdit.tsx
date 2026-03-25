import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  type?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export function InlineEdit({
  value,
  onSave,
  type = "text",
  options,
  disabled = false,
  className,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const successTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  useEffect(() => {
    return () => {
      if (successTimeout.current) clearTimeout(successTimeout.current);
    };
  }, []);

  function startEditing() {
    if (disabled || saving) return;
    setEditValue(String(value));
    setEditing(true);
  }

  const handleSave = useCallback(async () => {
    const newValue = type === "number" ? Number(editValue) : editValue;
    if (String(newValue) === String(value)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(newValue);
      setEditing(false);
      // Show success checkmark
      setShowSuccess(true);
      successTimeout.current = setTimeout(() => setShowSuccess(false), 1500);
    } catch {
      // Keep editing on failure so user can retry
    } finally {
      setSaving(false);
    }
  }, [editValue, value, type, onSave]);

  function handleCancel() {
    setEditValue(String(value));
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }

  // Display mode
  if (!editing) {
    const displayValue =
      type === "select"
        ? options?.find((o) => o.value === String(value))?.label ?? value
        : value;

    return (
      <span
        className={cn(
          "group relative inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-150",
          !disabled && "cursor-pointer hover:bg-muted/80",
          disabled && "cursor-default opacity-70",
          saving && "opacity-50",
          className,
        )}
        onClick={startEditing}
        title={disabled ? undefined : "Click to edit"}
        style={!disabled ? { cursor: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/></svg>') 0 16, text" } : undefined}
      >
        <span className="truncate">{String(displayValue)}</span>
        {saving && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
        )}
        {showSuccess && (
          <span className="inline-flex animate-in fade-in zoom-in duration-200">
            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
          </span>
        )}
      </span>
    );
  }

  // Edit mode - Select
  if (type === "select") {
    return (
      <div className="relative inline-block min-w-[120px]">
        <Select
          ref={inputRef as React.Ref<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => {
            const newVal = e.target.value;
            setEditValue(newVal);
            // Auto-save on select change
            setSaving(true);
            const saveValue = newVal;
            onSave(saveValue)
              .then(() => {
                setEditing(false);
                setShowSuccess(true);
                successTimeout.current = setTimeout(
                  () => setShowSuccess(false),
                  1500,
                );
              })
              .catch(() => {})
              .finally(() => setSaving(false));
          }}
          onBlur={handleCancel}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          disabled={saving}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        {saving && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  // Edit mode - Text/Number
  return (
    <div className="relative inline-block min-w-[80px]">
      <Input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-8 text-sm pr-7",
          saving && "opacity-70",
        )}
        disabled={saving}
      />
      {saving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
