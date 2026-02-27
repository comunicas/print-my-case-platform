import { format, getDay, getHours, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { extractBrandFromProductName } from "./productNormalization";
import { getBrandChartColor } from "./brandAssets";
import { getSalesIndex } from "./stockUtils";

// Types
export interface SaleRecord {
  id: string;
  payment_date: string;
  amount: number;
  refund_amount: number | null;
  product_name: string;
  payment_method?: string | null;
  pdv_id: string;
}

export interface SalesByDayData {
  date: string;
  dateDisplay: string;
  revenue: number;
  count: number;
}

// Time ranges for heatmap (2-hour blocks)
export const TIME_RANGES = [
  { id: 0, label: "08h-10h", start: 8, end: 9 },
  { id: 1, label: "10h-12h", start: 10, end: 11 },
  { id: 2, label: "12h-14h", start: 12, end: 13 },
  { id: 3, label: "14h-16h", start: 14, end: 15 },
  { id: 4, label: "16h-18h", start: 16, end: 17 },
  { id: 5, label: "18h-20h", start: 18, end: 19 },
  { id: 6, label: "20h-22h", start: 20, end: 21 },
  { id: 7, label: "22h-00h", start: 22, end: 23 },
] as const;

export interface HeatmapCell {
  rangeId: number;
  rangeLabel: string;
  dayOfWeek: number;
  dayName: string;
  revenue: number;
  count: number;
}

export interface TopProductData {
  name: string;
  revenue: number;
  count: number;
  brand: string;
}

export interface StockByBrandData {
  brand: string;
  quantity: number;
  fill: string;
}

export interface QuickStatsData {
  peakTimeRange: string | null;
  peakTimeRangeRevenue: number | null;
  bestDay: string | null;
  bestDayRevenue: number | null;
}

export interface LowStockItem {
  slotNumber: string;
  productName: string;
  brand: string;
  quantity: number;
  pdvName?: string;
  salesCount: number;
  salesIndex: 'high' | 'medium' | 'low' | 'none';
}

export interface SalesAmountRecord {
  amount: number | string;
  refund_amount?: number | string | null;
}

export interface KPIData {
  // Current period values
  totalRevenue: number;
  grossRevenue: number;
  totalRefunds: number;
  refundedTransactions: number;
  transactions: number;
  avgTicket: number;
  // Previous period values (for trend calculation)
  previousRevenue: number;
  previousTransactions: number;
  previousAvgTicket: number;
}

export interface LossesByDayData {
  date: string;
  dateDisplay: string;
  cancellations: number;
  cancellationCount: number;
  refunds: number;
  refundCount: number;
  total: number;
}

export interface CancellationRecord {
  payment_date: string;
  amount: number;
}

// Constants
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Agrupa vendas por dia
 */
export function getSalesByDay(sales: SaleRecord[]): SalesByDayData[] {
  const byDay = new Map<string, { revenue: number; count: number }>();
  
  for (const sale of sales) {
    // Extrai os primeiros 10 caracteres (YYYY-MM-DD) independente do formato
    const date = sale.payment_date.substring(0, 10);
    const current = byDay.get(date) || { revenue: 0, count: 0 };
    current.revenue += Number(sale.amount) - Number(sale.refund_amount || 0);
    current.count += 1;
    byDay.set(date, current);
  }
  
  return Array.from(byDay.entries())
    .map(([date, data]) => ({
      date,
      dateDisplay: format(parseISO(date), "EEE, dd/MM", { locale: ptBR }),
      revenue: data.revenue,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Identifica a faixa horária para uma hora específica (intervalos de 2h)
 */
function getTimeRangeForHour(hour: number): typeof TIME_RANGES[number] | null {
  return TIME_RANGES.find(range => hour >= range.start && hour < range.start + 2) || null;
}

/**
 * Agrupa vendas por faixa horária (2h) e dia da semana para heatmap
 */
export function getSalesByHourAndDay(sales: SaleRecord[]): HeatmapCell[] {
  const dataMap = new Map<string, { revenue: number; count: number }>();
  
  // Inicializa todas as células (8 faixas × 7 dias)
  for (const range of TIME_RANGES) {
    for (let day = 0; day < 7; day++) {
      dataMap.set(`${range.id}-${day}`, { revenue: 0, count: 0 });
    }
  }
  
  // Preenche com dados agrupando por faixa horária
  for (const sale of sales) {
    const date = parseISO(sale.payment_date);
    const hour = getHours(date);
    const day = getDay(date);
    const range = getTimeRangeForHour(hour);
    
    if (range) {
      const key = `${range.id}-${day}`;
      const current = dataMap.get(key)!;
      current.revenue += Number(sale.amount) - Number(sale.refund_amount || 0);
      current.count += 1;
    }
  }
  
  // Converte para array
  const heatmap: HeatmapCell[] = [];
  for (const range of TIME_RANGES) {
    for (let day = 0; day < 7; day++) {
      const data = dataMap.get(`${range.id}-${day}`)!;
      heatmap.push({
        rangeId: range.id,
        rangeLabel: range.label,
        dayOfWeek: day,
        dayName: DAY_NAMES[day],
        revenue: data.revenue,
        count: data.count,
      });
    }
  }
  
  return heatmap;
}

/**
 * Calcula o pico do heatmap
 */
export function getHeatmapPeak(heatmap: HeatmapCell[]): { rangeLabel: string; dayName: string; revenue: number } | null {
  if (heatmap.length === 0) return null;
  
  const peak = heatmap.reduce((max, cell) => 
    cell.revenue > max.revenue ? cell : max
  , heatmap[0]);
  
  if (peak.revenue === 0) return null;
  
  return {
    rangeLabel: peak.rangeLabel,
    dayName: peak.dayName,
    revenue: peak.revenue,
  };
}

/**
 * Retorna os 10 produtos mais vendidos por receita
 */
export function getTopProducts(sales: SaleRecord[], limit: number = 10): TopProductData[] {
  const byProduct = new Map<string, { revenue: number; count: number }>();
  
  for (const sale of sales) {
    const name = sale.product_name;
    const current = byProduct.get(name) || { revenue: 0, count: 0 };
    current.revenue += Number(sale.amount) - Number(sale.refund_amount || 0);
    current.count += 1;
    byProduct.set(name, current);
  }
  
  return Array.from(byProduct.entries())
    .map(([name, data]) => ({
      name,
      revenue: data.revenue,
      count: data.count,
      brand: extractBrandFromProductName(name),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Agrupa estoque por marca
 */
export function getStockByBrand(slots: { brand: string; quantity: number }[]): StockByBrandData[] {
  const byBrand = new Map<string, number>();
  
  for (const slot of slots) {
    const brand = slot.brand || "OUTROS";
    byBrand.set(brand, (byBrand.get(brand) || 0) + slot.quantity);
  }
  
  return Array.from(byBrand.entries())
    .map(([brand, quantity]) => ({
      brand,
      quantity,
      fill: getBrandChartColor(brand),
    }))
    .sort((a, b) => b.quantity - a.quantity);
}

/**
 * Calcula faixa horária de pico e melhor dia da semana
 */
export function getQuickStats(sales: SaleRecord[]): QuickStatsData {
  if (sales.length === 0) {
    return { peakTimeRange: null, peakTimeRangeRevenue: null, bestDay: null, bestDayRevenue: null };
  }
  
  // Agrupa por faixa horária (2h) em vez de hora individual
  const byRange = new Map<number, { label: string; revenue: number }>();
  for (const range of TIME_RANGES) {
    byRange.set(range.id, { label: range.label, revenue: 0 });
  }
  
  for (const sale of sales) {
    const hour = getHours(parseISO(sale.payment_date));
    const range = getTimeRangeForHour(hour);
    if (range) {
      const current = byRange.get(range.id)!;
      current.revenue += Number(sale.amount) - Number(sale.refund_amount || 0);
    }
  }
  
  // Agrupa por dia da semana
  const byDay = new Map<number, number>();
  for (const sale of sales) {
    const day = getDay(parseISO(sale.payment_date));
    const revenue = Number(sale.amount) - Number(sale.refund_amount || 0);
    byDay.set(day, (byDay.get(day) || 0) + revenue);
  }
  
  // Encontra faixa de pico
  let peakTimeRange: string | null = null;
  let peakTimeRangeRevenue = 0;
  for (const [, data] of byRange.entries()) {
    if (data.revenue > peakTimeRangeRevenue) {
      peakTimeRangeRevenue = data.revenue;
      peakTimeRange = data.label;
    }
  }
  
  let bestDay: number | null = null;
  let bestDayRevenue = 0;
  for (const [day, revenue] of byDay.entries()) {
    if (revenue > bestDayRevenue) {
      bestDayRevenue = revenue;
      bestDay = day;
    }
  }
  
  return {
    peakTimeRange,
    peakTimeRangeRevenue: peakTimeRangeRevenue > 0 ? peakTimeRangeRevenue : null,
    bestDay: bestDay !== null ? DAY_NAMES[bestDay] : null,
    bestDayRevenue: bestDayRevenue > 0 ? bestDayRevenue : null,
  };
}

/**
 * Retorna itens com estoque baixo/crítico
 */
export function getLowStockItems(
  slots: { slotNumber: string; productName: string; brand: string; quantity: number; pdvName?: string }[],
  salesByProduct: Map<string, number>,
  threshold: number = 1
): LowStockItem[] {
  return slots
    .filter(slot => slot.quantity <= threshold)
    .map(slot => {
      const salesCount = salesByProduct.get(slot.productName) || 0;
      return {
        slotNumber: slot.slotNumber,
        productName: slot.productName,
        brand: slot.brand,
        quantity: slot.quantity,
        pdvName: slot.pdvName,
        salesCount,
        salesIndex: getSalesIndex(salesCount),
      };
    })
    .sort((a, b) => a.quantity - b.quantity);
}

// getSalesIndex removida: usa a versão canônica de stockUtils.ts (sem duplicação)

// ===== KPI CALCULATION FUNCTIONS =====

/**
 * Calcula a receita total líquida de uma lista de vendas
 */
export function calculateTotalRevenue(sales: SalesAmountRecord[]): number {
  return sales.reduce(
    (sum, record) => sum + (Number(record.amount) - Number(record.refund_amount || 0)),
    0
  );
}


/**
 * Calcula todos os KPIs do dashboard a partir dos dados de vendas
 */
export function calculateKPIs(
  currentSales: SalesAmountRecord[],
  previousSales: SalesAmountRecord[]
): KPIData {
  // Calcula receita bruta (soma de amounts)
  const grossRevenue = currentSales.reduce(
    (sum, record) => sum + Number(record.amount),
    0
  );
  
  // Calcula total de reembolsos
  const totalRefunds = currentSales.reduce(
    (sum, record) => sum + Number(record.refund_amount || 0),
    0
  );
  
  // Conta transações com reembolso
  const refundedTransactions = currentSales.filter(
    record => Number(record.refund_amount || 0) > 0
  ).length;
  
  // Receita líquida
  const totalRevenue = grossRevenue - totalRefunds;
  const transactions = currentSales.length;
  const avgTicket = transactions > 0 ? totalRevenue / transactions : 0;

  const previousRevenue = calculateTotalRevenue(previousSales);
  const previousTransactions = previousSales.length;
  
  // Calcula reembolsos do período anterior
  const previousAvgTicket = previousTransactions > 0
    ? previousRevenue / previousTransactions
    : 0;

  return {
    totalRevenue,
    grossRevenue,
    totalRefunds,
    refundedTransactions,
    transactions,
    avgTicket,
    previousRevenue,
    previousTransactions,
    previousAvgTicket,
  };
}

/**
 * Agrupa perdas (cancelamentos e reembolsos) por dia
 */
export function getLossesByDay(
  sales: SaleRecord[],
  cancellations: CancellationRecord[]
): LossesByDayData[] {
  const byDay = new Map<string, { 
    cancellations: number; 
    cancellationCount: number;
    refunds: number; 
    refundCount: number;
  }>();
  
  // Agrupa cancelamentos por dia
  for (const cancel of cancellations) {
    const date = cancel.payment_date.substring(0, 10);
    const current = byDay.get(date) || { 
      cancellations: 0, cancellationCount: 0, 
      refunds: 0, refundCount: 0 
    };
    current.cancellations += Number(cancel.amount);
    current.cancellationCount += 1;
    byDay.set(date, current);
  }
  
  // Agrupa reembolsos por dia (do campo refund_amount nas vendas)
  for (const sale of sales) {
    const refundAmount = Number(sale.refund_amount || 0);
    if (refundAmount > 0) {
      const date = sale.payment_date.substring(0, 10);
      const current = byDay.get(date) || { 
        cancellations: 0, cancellationCount: 0, 
        refunds: 0, refundCount: 0 
      };
      current.refunds += refundAmount;
      current.refundCount += 1;
      byDay.set(date, current);
    }
  }
  
  return Array.from(byDay.entries())
    .map(([date, data]) => ({
      date,
      dateDisplay: format(parseISO(date), "EEE, dd/MM", { locale: ptBR }),
      cancellations: data.cancellations,
      cancellationCount: data.cancellationCount,
      refunds: data.refunds,
      refundCount: data.refundCount,
      total: data.cancellations + data.refunds,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Exporta dados para Excel
 */
export async function exportToExcel(data: Record<string, string | number>[], filename: string) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Dados");

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
    data.forEach(row => worksheet.addRow(row));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
