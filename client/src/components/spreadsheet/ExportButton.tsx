import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Server, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToCsv, downloadFromApi } from "@/lib/export";
import { useToast } from "@/components/ui/toast";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
  apiPath?: string;
}

export function ExportButton({
  data,
  filename,
  label = "Export",
  apiPath,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  function handleExcelExport() {
    try {
      if (data.length === 0) {
        toast("No data to export", "info");
        return;
      }
      exportToExcel(data, filename);
      toast(`Exported ${data.length} rows as Excel`, "success");
    } catch {
      toast("Failed to export as Excel", "error");
    }
  }

  function handleCsvExport() {
    try {
      if (data.length === 0) {
        toast("No data to export", "info");
        return;
      }
      exportToCsv(data, filename);
      toast(`Exported ${data.length} rows as CSV`, "success");
    } catch {
      toast("Failed to export as CSV", "error");
    }
  }

  async function handleServerDownload() {
    if (!apiPath) return;
    setExporting(true);
    try {
      await downloadFromApi(apiPath, `${filename}.xlsx`);
      toast("File downloaded from server", "success");
    } catch {
      toast("Failed to download from server", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcelExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCsvExport}>
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          Export as CSV
        </DropdownMenuItem>
        {apiPath && (
          <DropdownMenuItem onClick={handleServerDownload}>
            <Server className="mr-2 h-4 w-4 text-purple-600" />
            Download from Server
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
