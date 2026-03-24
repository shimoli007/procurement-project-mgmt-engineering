import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Save, Download, Upload, Database, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CompanySettings {
  company_name: string;
  address: string;
  phone: string;
  email: string;
}

interface SettingEntry {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreWarning, setShowRestoreWarning] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAccess = user?.role === "CEO" || user?.role === "Procurement";

  useEffect(() => {
    async function loadSettings() {
      try {
        const keys = ["company_name", "address", "phone", "email"];
        const entries: CompanySettings = {
          company_name: "",
          address: "",
          phone: "",
          email: "",
        };
        // Try loading each setting individually
        for (const key of keys) {
          try {
            const entry = await api.get<SettingEntry>(`/settings/${key}`);
            if (entry && entry.value !== undefined) {
              entries[key as keyof CompanySettings] = entry.value;
            }
          } catch {
            // Setting may not exist yet, that's fine
          }
        }
        setSettings(entries);
      } catch {
        // Fallback: try the old endpoint
        try {
          const data = await api.get<CompanySettings>("/settings");
          setSettings(data);
        } catch {
          // ignore
        }
      }
    }
    if (canAccess) {
      loadSettings();
    }
  }, [canAccess]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const entries = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));
      await api.post("/settings/bulk", { settings: entries });
      toast("Company profile updated successfully", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportJson() {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${window.location.origin}/api/backup/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Database exported as JSON", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadDb() {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${window.location.origin}/api/backup/download-db`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `database-${new Date().toISOString().slice(0, 10)}.db`;
      a.click();
      URL.revokeObjectURL(url);
      toast("SQLite database downloaded", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Download failed", "error");
    } finally {
      setDownloading(false);
    }
  }

  function handleRestoreFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setRestoreFile(file);
      setShowRestoreWarning(true);
    }
    // Reset the input so user can re-select the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleRestore() {
    if (!restoreFile) return;
    setRestoring(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", restoreFile);
      const res = await fetch(`${window.location.origin}/api/backup/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as Record<string, string>).error || "Restore failed");
      }
      toast("Database restored successfully. Please refresh the page.", "success");
      setShowRestoreWarning(false);
      setRestoreFile(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Restore failed", "error");
    } finally {
      setRestoring(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p>You do not have permission to access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage company profile and system configuration
        </p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card className="p-6 space-y-4">
            <form onSubmit={handleSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) =>
                      setSettings({ ...settings, company_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) =>
                      setSettings({ ...settings, address: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Data Management</h3>
              <p className="text-sm text-muted-foreground">
                Backup and restore your database
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium">Export Database</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Export all data as a JSON file for portability.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportJson}
                  disabled={exporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? "Exporting..." : "Export JSON"}
                </Button>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium">Download SQLite DB</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Download the raw SQLite database file.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadDb}
                  disabled={downloading}
                >
                  <Database className="mr-2 h-4 w-4" />
                  {downloading ? "Downloading..." : "Download DB"}
                </Button>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium">Restore Database</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a backup file to restore the database.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.db,.sqlite"
                  className="hidden"
                  onChange={handleRestoreFileChange}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File & Restore
                </Button>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Warning Dialog */}
      <Dialog open={showRestoreWarning} onOpenChange={setShowRestoreWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Restore Database
            </DialogTitle>
            <DialogDescription>
              This will replace <strong>all current data</strong> with the contents of the
              uploaded file. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">Warning: Destructive operation</p>
            <p className="mt-1">
              File: {restoreFile?.name ?? "None selected"}
            </p>
            <p>
              Make sure you have a backup of your current data before proceeding.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRestoreWarning(false);
                setRestoreFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? "Restoring..." : "Restore Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
