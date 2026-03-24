import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  Globe,
  Webhook,
} from "lucide-react";

interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  permissions: string;
  last_used_at: string | null;
  created_at: string;
}

interface WebhookEntry {
  id: number;
  url: string;
  events: string;
  secret: string;
  is_active: number;
  created_at: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString();
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhooksLoading, setWebhooksLoading] = useState(true);

  // Generate key dialog
  const [generateOpen, setGenerateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState("read");
  const [generatedKey, setGeneratedKey] = useState("");
  const [generating, setGenerating] = useState(false);

  // Revoke dialog
  const [revokeId, setRevokeId] = useState<number | null>(null);

  // Webhook dialog
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);

  const availableEvents = [
    "order.created",
    "order.updated",
    "order.delivered",
    "item.created",
    "item.updated",
    "project.created",
    "project.updated",
  ];

  const fetchKeys = useCallback(() => {
    setLoading(true);
    api
      .get<ApiKey[]>("/organization/api-keys")
      .then(setKeys)
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, []);

  const fetchWebhooks = useCallback(() => {
    setWebhooksLoading(true);
    api
      .get<WebhookEntry[]>("/organization/webhooks")
      .then(setWebhooks)
      .catch(() => setWebhooks([]))
      .finally(() => setWebhooksLoading(false));
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
  }, [fetchKeys, fetchWebhooks]);

  async function handleGenerate() {
    if (!newKeyName.trim()) {
      toast("Please enter a key name", "error");
      return;
    }
    setGenerating(true);
    try {
      const result = await api.post<{ id: number; key: string }>("/organization/api-keys", {
        name: newKeyName,
        permissions: newKeyPermissions,
      });
      setGeneratedKey(result.key);
      fetchKeys();
    } catch {
      toast("Failed to generate API key", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke() {
    if (revokeId === null) return;
    try {
      await api.delete(`/organization/api-keys/${revokeId}`);
      toast("API key revoked", "success");
      setRevokeId(null);
      fetchKeys();
    } catch {
      toast("Failed to revoke key", "error");
    }
  }

  async function handleCreateWebhook() {
    if (!webhookUrl.trim() || webhookEvents.length === 0) {
      toast("URL and at least one event are required", "error");
      return;
    }
    try {
      await api.post("/organization/webhooks", {
        url: webhookUrl,
        events: webhookEvents,
      });
      toast("Webhook created", "success");
      setWebhookOpen(false);
      setWebhookUrl("");
      setWebhookEvents([]);
      fetchWebhooks();
    } catch {
      toast("Failed to create webhook", "error");
    }
  }

  async function handleDeleteWebhook(id: number) {
    try {
      await api.delete(`/organization/webhooks/${id}`);
      toast("Webhook deleted", "success");
      fetchWebhooks();
    } catch {
      toast("Failed to delete webhook", "error");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast("Copied to clipboard", "success");
    });
  }

  function toggleEvent(event: string) {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Key className="h-6 w-6 text-primary" />
          API & Integrations
        </h1>
        <p className="text-muted-foreground">
          Manage API keys and webhook integrations
        </p>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">API Keys</CardTitle>
              <CardDescription>
                Use API keys to authenticate external integrations
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setGenerateOpen(true);
                setNewKeyName("");
                setNewKeyPermissions("read");
                setGeneratedKey("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No API keys generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Key</th>
                    <th className="pb-2 pr-4">Permissions</th>
                    <th className="pb-2 pr-4">Last Used</th>
                    <th className="pb-2 pr-4">Created</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{k.name}</td>
                      <td className="py-3 pr-4">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {k.key_prefix}
                        </code>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className="text-xs">
                          {k.permissions}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {formatDate(k.last_used_at)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {formatDate(k.created_at)}
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setRevokeId(k.id)}
                          title="Revoke key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receive event notifications at external URLs
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setWebhookOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooksLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No webhooks configured.
            </p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{wh.url}</p>
                      <p className="text-xs text-muted-foreground">
                        Events: {wh.events}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={wh.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {wh.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteWebhook(wh.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog
        open={generateOpen}
        onOpenChange={(open) => {
          setGenerateOpen(open);
          if (!open) setGeneratedKey("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external integrations.
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    Copy this key now. It will not be shown again.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">
                  {generatedKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatedKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setGenerateOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production API"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-permissions">Permissions</Label>
                <Select
                  id="key-permissions"
                  value={newKeyPermissions}
                  onChange={(e) => setNewKeyPermissions(e.target.value)}
                >
                  <option value="read">Read Only</option>
                  <option value="read_write">Read & Write</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setGenerateOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generating..." : "Generate Key"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <Dialog open={revokeId !== null} onOpenChange={() => setRevokeId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Any integrations using this key will
              stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke}>
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Dialog */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Configure an endpoint to receive event notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://example.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableEvents.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded border-border"
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWebhook}>Create Webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
