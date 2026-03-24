import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  XCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";

interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: ValidationError[];
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "items" | "suppliers" | "orders";
  onSuccess: () => void;
}

const TEMPLATE_COLUMNS: Record<string, { key: string; required: boolean }[]> = {
  items: [
    { key: "name", required: true },
    { key: "description", required: false },
    { key: "unit", required: false },
    { key: "category", required: false },
  ],
  suppliers: [
    { key: "name", required: true },
    { key: "contact_email", required: false },
    { key: "contact_phone", required: false },
    { key: "address", required: false },
  ],
  orders: [
    { key: "item_name", required: true },
    { key: "quantity", required: true },
    { key: "supplier_name", required: false },
    { key: "notes", required: false },
  ],
};

type Step = "upload" | "preview" | "validating" | "importing" | "result";

export function ImportDialog({
  open,
  onOpenChange,
  entityType,
  onSuccess,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [step, setStep] = useState<Step>("upload");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setValidationErrors([]);
    setStep("upload");
    setResult(null);
    setImportProgress(0);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  }

  function parseFile(selectedFile: File) {
    setFile(selectedFile);
    setResult(null);
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (jsonData.length === 0) {
          setValidationErrors([{ row: 0, message: "File contains no data rows." }]);
          setStep("upload");
          return;
        }

        const cols = Object.keys(jsonData[0]);
        setHeaders(cols);
        setParsedData(jsonData);
        setStep("preview");
      } catch {
        setValidationErrors([
          { row: 0, message: "Failed to parse file. Please check the format." },
        ]);
        setStep("upload");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) parseFile(selectedFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.split(".").pop()?.toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
        setValidationErrors([
          { row: 0, message: "Invalid file type. Please use .xlsx, .xls, or .csv files." },
        ]);
        return;
      }
      parseFile(droppedFile);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleValidate() {
    setStep("validating");
    const errors: ValidationError[] = [];
    const requiredFields = TEMPLATE_COLUMNS[entityType]
      .filter((c) => c.required)
      .map((c) => c.key);

    parsedData.forEach((row, idx) => {
      requiredFields.forEach((field) => {
        const val = row[field];
        if (val === undefined || val === null || String(val).trim() === "") {
          errors.push({
            row: idx + 1,
            field,
            message: `"${field}" is required`,
          });
        }
      });

      // Type-specific validations
      if (entityType === "orders") {
        const qty = row["quantity"];
        if (qty !== undefined && qty !== null && qty !== "") {
          const num = Number(qty);
          if (isNaN(num) || num <= 0) {
            errors.push({
              row: idx + 1,
              field: "quantity",
              message: "Quantity must be a positive number",
            });
          }
        }
      }

      if (entityType === "suppliers") {
        const email = row["contact_email"];
        if (email && typeof email === "string" && email.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errors.push({
              row: idx + 1,
              field: "contact_email",
              message: "Invalid email format",
            });
          }
        }
      }
    });

    setValidationErrors(errors);
    setStep("preview");
  }

  async function handleImport() {
    if (parsedData.length === 0) return;
    setStep("importing");
    setImportProgress(0);
    setValidationErrors([]);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const res = await api.post<ImportResult>(`/import/${entityType}`, {
        data: parsedData,
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      setResult(res);
      setStep("result");

      if (res.errors.length === 0) {
        toast(`Successfully imported ${res.imported} ${entityType}`, "success");
        onSuccess();
      } else {
        toast(
          `Imported ${res.imported}, ${res.errors.length} error(s)`,
          "info",
        );
        if (res.imported > 0) onSuccess();
      }
    } catch (err) {
      setStep("preview");
      const message = err instanceof Error ? err.message : "Import failed.";
      setValidationErrors([{ row: 0, message }]);
      toast(message, "error");
    }
  }

  function handleDownloadTemplate() {
    const cols = TEMPLATE_COLUMNS[entityType] ?? [];
    const headerRow: Record<string, string> = {};
    cols.forEach((c) => {
      headerRow[c.required ? `${c.key}*` : c.key] = "";
    });

    const worksheet = XLSX.utils.json_to_sheet([headerRow]);

    // Set column widths
    worksheet["!cols"] = cols.map((c) => ({ wch: Math.max(c.key.length + 4, 15) }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entityType);
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entityType}_template.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const errorRowSet = new Set(validationErrors.map((e) => e.row));
  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const previewRows = parsedData.slice(0, 10);
  const hasValidationErrors = validationErrors.length > 0 && validationErrors.some((e) => e.row > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import {entityLabel}
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import {entityType}. Download the
            template for the correct column format.
          </DialogDescription>
        </DialogHeader>

        {/* Result summary */}
        {step === "result" && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Import Complete</p>
                <p className="text-sm mt-0.5">
                  {result.imported} imported
                  {result.skipped > 0 && `, ${result.skipped} skipped`}
                  {result.errors.length > 0 &&
                    `, ${result.errors.length} error(s)`}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm text-destructive">
                    {result.errors.length} Error(s)
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="space-y-1 text-sm text-destructive/90">
                    {result.errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-xs font-mono bg-destructive/10 px-1.5 py-0.5 rounded shrink-0">
                          Row {err.row}
                        </span>
                        <span>{err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Importing progress */}
        {step === "importing" && (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">
                Importing {parsedData.length} rows...
              </span>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Please do not close this dialog
            </p>
          </div>
        )}

        {/* File upload area */}
        {(step === "upload" || step === "preview" || step === "validating") && (
          <>
            <div
              className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-all duration-200 cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-3">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{file.name}</span>
                    <Badge variant="secondary">{parsedData.length} rows</Badge>
                    <Badge variant="secondary">{headers.length} columns</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click or drop a new file to replace
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports .xlsx, .xls, .csv files
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm text-destructive">
                    {validationErrors.some((e) => e.row === 0)
                      ? "Error"
                      : `${validationErrors.length} Validation Error(s)`}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="space-y-1 text-sm text-destructive/90">
                    {validationErrors.map((err, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        {err.row > 0 && (
                          <span className="text-xs font-mono bg-destructive/10 px-1.5 py-0.5 rounded shrink-0">
                            Row {err.row}
                          </span>
                        )}
                        <span>
                          {err.field && (
                            <span className="font-medium">{err.field}: </span>
                          )}
                          {err.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Preview table */}
            {step === "preview" && parsedData.length > 0 && headers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Preview (first {Math.min(10, parsedData.length)} of{" "}
                    {parsedData.length} rows)
                  </p>
                </div>
                <div className="overflow-auto max-h-64 rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12 text-xs font-semibold">#</TableHead>
                        {headers.map((h) => {
                          const colDef = TEMPLATE_COLUMNS[entityType]?.find(
                            (c) => c.key === h,
                          );
                          return (
                            <TableHead key={h} className="text-xs font-semibold">
                              {h}
                              {colDef?.required && (
                                <span className="text-destructive ml-0.5">*</span>
                              )}
                            </TableHead>
                          );
                        })}
                        {validationErrors.length > 0 && (
                          <TableHead className="w-8 text-xs">Status</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, idx) => {
                        const rowErrors = validationErrors.filter(
                          (e) => e.row === idx + 1,
                        );
                        const hasError = rowErrors.length > 0;
                        return (
                          <TableRow
                            key={idx}
                            className={
                              hasError
                                ? "bg-destructive/5 hover:bg-destructive/10"
                                : ""
                            }
                          >
                            <TableCell className="text-muted-foreground text-xs font-mono">
                              {idx + 1}
                            </TableCell>
                            {headers.map((h) => {
                              const cellHasError = rowErrors.some(
                                (e) => e.field === h,
                              );
                              return (
                                <TableCell
                                  key={h}
                                  className={`text-xs ${
                                    cellHasError
                                      ? "text-destructive font-medium"
                                      : ""
                                  }`}
                                >
                                  {String(row[h] ?? "")}
                                  {cellHasError && (
                                    <AlertCircle className="inline-block ml-1 h-3 w-3 text-destructive" />
                                  )}
                                </TableCell>
                              );
                            })}
                            {validationErrors.length > 0 && (
                              <TableCell>
                                {hasError ? (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      {parsedData.length > 10 && (
                        <TableRow>
                          <TableCell
                            colSpan={
                              headers.length +
                              1 +
                              (validationErrors.length > 0 ? 1 : 0)
                            }
                            className="text-center text-xs text-muted-foreground py-3"
                          >
                            ... and {parsedData.length - 10} more rows
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <div className="flex-1" />
          {step === "result" ? (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          ) : step === "importing" ? null : (
            <div className="flex items-center gap-2">
              {step === "preview" && parsedData.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleValidate}
                  disabled={parsedData.length === 0}
                >
                  Validate
                </Button>
              )}
              <Button
                onClick={handleImport}
                disabled={
                  parsedData.length === 0 || step === "validating" || hasValidationErrors
                }
              >
                Import {parsedData.length > 0 ? `${parsedData.length} Rows` : ""}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
