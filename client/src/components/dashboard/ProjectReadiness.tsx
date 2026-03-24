import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectReadinessItem {
  project_id: number;
  project_name: string;
  readiness_pct: number;
}

interface ProjectReadinessProps {
  projects: ProjectReadinessItem[];
  loading: boolean;
}

function getBarColor(pct: number): string {
  if (pct < 30) return "bg-red-500";
  if (pct < 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function getTextColor(pct: number): string {
  if (pct < 30) return "text-red-500";
  if (pct < 70) return "text-amber-500";
  return "text-emerald-500";
}

export default function ProjectReadiness({
  projects,
  loading,
}: ProjectReadinessProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <FolderKanban className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">Project Readiness</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active projects.
          </p>
        ) : (
          <div className="space-y-5">
            {projects.map((project) => {
              const pct = Math.round(project.readiness_pct);
              return (
                <div key={project.project_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {project.project_name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "ml-3 shrink-0 text-sm font-semibold tabular-nums",
                        getTextColor(pct)
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getBarColor(pct)
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
