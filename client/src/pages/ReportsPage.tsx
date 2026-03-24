import { useState, useEffect } from "react";
import type { Project } from "@/types";
import { api } from "@/lib/api";
import {
  FileText,
  Truck,
  FolderKanban,
  BarChart3,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { OrdersSummaryReport } from "@/components/reports/OrdersSummaryReport";
import { SupplierPerformanceReport } from "@/components/reports/SupplierPerformanceReport";
import { ProjectReport } from "@/components/reports/ProjectReport";

type ReportType = "orders" | "supplier" | "project" | "procurement" | null;

const reportCards = [
  {
    key: "orders" as const,
    title: "Orders Summary",
    description: "Overview of all procurement orders",
    icon: FileText,
  },
  {
    key: "supplier" as const,
    title: "Supplier Performance",
    description: "Track supplier reliability and pricing",
    icon: Truck,
  },
  {
    key: "project" as const,
    title: "Project Reports",
    description: "Detailed project material reports",
    icon: FolderKanban,
  },
  {
    key: "procurement" as const,
    title: "Procurement Status",
    description: "Cross-project procurement overview",
    icon: BarChart3,
  },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  useEffect(() => {
    api.get<Project[]>("/projects").then(setProjects).catch(() => {});
  }, []);

  function handleCardClick(key: ReportType) {
    if (key === "project") {
      setShowProjectSelector(true);
      return;
    }
    setActiveReport(key);
  }

  function handleProjectSelect(value: string) {
    const id = parseInt(value, 10);
    setSelectedProjectId(id);
    setShowProjectSelector(false);
    setActiveReport("project");
  }

  function handleClose() {
    setActiveReport(null);
    setSelectedProjectId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view procurement reports
        </p>
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              className="cursor-pointer p-6 transition-colors hover:bg-accent"
              onClick={() => handleCardClick(card.key)}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Project selector dialog */}
      <Dialog open={showProjectSelector} onOpenChange={setShowProjectSelector}>
        <DialogContent className="sm:max-w-md">
          <h2 className="text-lg font-semibold">Select a Project</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose a project to generate the report for.
          </p>
          <Select
            value=""
            onChange={(e) => handleProjectSelect(e.target.value)}
          >
            <SelectOption value="" disabled>Select project...</SelectOption>
            {projects.map((p) => (
              <SelectOption key={p.id} value={String(p.id)}>
                {p.name}
              </SelectOption>
            ))}
          </Select>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={activeReport !== null} onOpenChange={() => handleClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 no-print">
            <h2 className="text-lg font-semibold">
              {activeReport === "orders" && "Orders Summary Report"}
              {activeReport === "supplier" && "Supplier Performance Report"}
              {activeReport === "project" && "Project Report"}
              {activeReport === "procurement" && "Procurement Status Report"}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {activeReport === "orders" && <OrdersSummaryReport />}
          {activeReport === "supplier" && <SupplierPerformanceReport />}
          {activeReport === "project" && selectedProjectId && (
            <ProjectReport projectId={selectedProjectId} />
          )}
          {activeReport === "procurement" && <OrdersSummaryReport />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
