import { useState, useEffect } from "react";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_STATUSES } from "@/lib/constants";
import type { Project } from "@/types";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSubmit: (data: Partial<Project>) => Promise<void>;
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  onSubmit,
}: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState("Active");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (project) {
        setName(project.name || "");
        setDescription(project.description || "");
        setClientName(project.client_name || "");
        setStatus(project.status || "Active");
        setStartDate(project.start_date ? project.start_date.split("T")[0] : "");
        setTargetDate(project.target_date ? project.target_date.split("T")[0] : "");
      } else {
        setName("");
        setDescription("");
        setClientName("");
        setStatus("Active");
        setStartDate("");
        setTargetDate("");
      }
      setErrors({});
    }
  }, [open, project]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Project name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        client_name: clientName.trim() || undefined,
        status,
        start_date: startDate || undefined,
        target_date: targetDate || undefined,
      } as Partial<Project>);
      onOpenChange(false);
    } catch {
      // error handled by caller
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogDescription>
            {project
              ? "Update the project details below."
              : "Fill in the details to create a new project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-client">Client Name</Label>
            <Input
              id="project-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client or company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-status">Status</Label>
            <Select
              id="project-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-start">Start Date</Label>
              <Input
                id="project-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-target">Target Date</Label>
              <Input
                id="project-target"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

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
                : project
                  ? "Update Project"
                  : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
