import * as XLSX from "xlsx";
import {
  SALES_REQUIRED_COLUMNS,
  STOCK_REQUIRED_COLUMNS,
  UploadType,
  ColumnValidationResult,
} from "@/lib/schemas/upload";

export async function validateSpreadsheetColumns(
  file: File,
  type: UploadType
): Promise<ColumnValidationResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

  const headers = (jsonData[0] || []).map((h) => String(h || "").trim());
  const requiredColumns =
    type === "sales" ? SALES_REQUIRED_COLUMNS : STOCK_REQUIRED_COLUMNS;

  const normalizeColumn = (col: string) => col.toLowerCase().trim();

  const missingColumns = requiredColumns.filter(
    (col) =>
      !headers.some((h) => normalizeColumn(h) === normalizeColumn(col))
  );

  return {
    isValid: missingColumns.length === 0,
    missingColumns: [...missingColumns],
    foundColumns: headers.filter((h) => h),
    totalRows: Math.max(0, jsonData.length - 1),
  };
}
