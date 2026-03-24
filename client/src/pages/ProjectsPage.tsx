import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Plus, FolderKanban } from "lucide-react";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projects, loading, createProject, updateProject, deleteProject } =
    useProjects();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleCreate() {
    setEditProject(null);
    setFormOpen(true);
  }

  function handleEdit(project: Project) {
    setEditProject(project);
    setFormOpen(true);
  }

  function handleDeletePrompt(project: Project) {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }

  async function handleFormSubmit(data: Partial<Project>) {
    try {
      if (editProject) {
        await updateProject(editProject.id, data);
        toast("Project updated successfully", "success");
      } else {
        await createProject(data);
        toast("Project created successfully", "success");
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to save project",
        "error"
      );
      throw err;
    }
  }

  async function handleConfirmDelete() {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      toast("Project deleted successfully", "success");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete project",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage engineering projects and their procurement needs
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading projects...
          </div>
        ) : (
          <ProjectsTable
            projects={projects}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
            userRole={user?.role || ""}
          />
        )}
      </div>

      {/* Create/Edit Form */}
      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editProject}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {projectToDelete?.name}
              </span>
              ? This action cannot be undone. All associated BOM lines will also
              be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
