import { useState, useEffect } from "react";
import type { Supplier } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSubmit: (data: Partial<Supplier>) => Promise<void>;
}

export function SupplierForm({
  open,
  onOpenChange,
  supplier,
  onSubmit,
}: SupplierFormProps) {
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = supplier !== null;

  useEffect(() => {
    if (open) {
      if (supplier) {
        setName(supplier.name);
        setContactEmail(supplier.contact_email || "");
        setContactPhone(supplier.contact_phone || "");
        setAddress(supplier.address || "");
        setNotes(supplier.notes || "");
      } else {
        setName("");
        setContactEmail("");
        setContactPhone("");
        setAddress("");
        setNotes("");
      }
      setError("");
    }
  }, [open, supplier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Supplier name is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: trimmedName,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save supplier."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the supplier details below."
              : "Fill in the details for the new supplier."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Name *</Label>
            <Input
              id="supplier-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter supplier name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-email">Email</Label>
            <Input
              id="supplier-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-phone">Phone</Label>
            <Input
              id="supplier-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-address">Address</Label>
            <Input
              id="supplier-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, state"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-notes">Notes</Label>
            <Textarea
              id="supplier-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this supplier"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Supplier"
                  : "Add Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
