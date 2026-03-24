import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  userRole: string;
}

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-800 border-green-300",
  "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-300",
  Completed: "bg-blue-100 text-blue-800 border-blue-300",
  Cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString();
}

export function ProjectsTable({
  projects,
  onEdit,
  onDelete,
  userRole,
}: ProjectsTableProps) {
  const navigate = useNavigate();
  const isProcurement = userRole === "CEO" || userRole === "Procurement";

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No projects found</p>
        <p className="text-sm">Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Target Date</TableHead>
          <TableHead>Created By</TableHead>
          <TableHead className="w-[60px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow
            key={project.id}
            className="cursor-pointer"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>{project.client_name || "-"}</TableCell>
            <TableCell>
              <Badge
                className={cn(
                  "font-medium",
                  statusColor[project.status] || statusColor.Active
                )}
              >
                {project.status}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(project.start_date)}</TableCell>
            <TableCell>{formatDate(project.target_date)}</TableCell>
            <TableCell>{project.creator_name || "-"}</TableCell>
            <TableCell>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {isProcurement && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(project)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
