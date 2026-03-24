import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1",
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on content
  const colWidths = Object.keys(data[0] ?? {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length),
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportToCsv(
  data: Record<string, unknown>[],
  filename: string,
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export async function downloadFromApi(
  path: string,
  filename: string,
): Promise<void> {
  const token = localStorage.getItem("token");
  const baseUrl = `${window.location.origin}/api`;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  saveAs(blob, filename);
}
