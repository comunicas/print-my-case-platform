import * as XLSX from "xlsx";
import {
  SALES_REQUIRED_COLUMNS,
  STOCK_REQUIRED_COLUMNS,
  SALES_COLUMN_ALIASES,
  STOCK_COLUMN_ALIASES,
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
  const columnAliases =
    type === "sales" ? SALES_COLUMN_ALIASES : STOCK_COLUMN_ALIASES;

  const normalizeColumn = (col: string) => col.toLowerCase().trim();

  // Verificar se cada coluna obrigatória tem pelo menos um alias presente
  const missingColumns = requiredColumns.filter((requiredCol) => {
    const aliases = columnAliases[requiredCol] || [requiredCol];
    return !aliases.some((alias) =>
      headers.some((h) => normalizeColumn(h) === normalizeColumn(alias))
    );
  });

  return {
    isValid: missingColumns.length === 0,
    missingColumns: [...missingColumns],
    foundColumns: headers.filter((h) => h),
    totalRows: Math.max(0, jsonData.length - 1),
  };
}
