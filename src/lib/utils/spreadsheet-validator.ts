import ExcelJS from "exceljs";
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
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);

  const firstSheet = workbook.worksheets[0];
  const headerRow = firstSheet?.getRow(1);
  const headers: string[] = [];

  if (headerRow) {
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value ?? "").trim());
    });
  }

  const requiredColumns =
    type === "sales" ? SALES_REQUIRED_COLUMNS : STOCK_REQUIRED_COLUMNS;
  const columnAliases =
    type === "sales" ? SALES_COLUMN_ALIASES : STOCK_COLUMN_ALIASES;

  const normalizeColumn = (col: string) => col.toLowerCase().trim();

  const missingColumns = requiredColumns.filter((requiredCol) => {
    const aliases = columnAliases[requiredCol] || [requiredCol];
    return !aliases.some((alias) =>
      headers.some((h) => normalizeColumn(h) === normalizeColumn(alias))
    );
  });

  const totalRows = Math.max(0, (firstSheet?.rowCount ?? 1) - 1);

  return {
    isValid: missingColumns.length === 0,
    missingColumns: [...missingColumns],
    foundColumns: headers.filter((h) => h),
    totalRows,
  };
}
