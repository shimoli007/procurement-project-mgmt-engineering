import { Printer, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintableReportProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PrintableReport({
  title,
  subtitle,
  children,
}: PrintableReportProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-report, .printable-report * { visibility: visible; }
          .printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="printable-report">
        {/* Print button */}
        <div className="no-print mb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>

        {/* Company header */}
        <div className="mb-6 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">Cynea ProcureEng</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {/* Report content */}
        <div className="space-y-6">{children}</div>

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          Generated on {new Date().toLocaleDateString()} at{" "}
          {new Date().toLocaleTimeString()} | Cynea ProcureEng Procurement Management System
        </div>
      </div>
    </>
  );
}
