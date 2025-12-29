import { format, getDay, getHours, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { extractBrandFromProductName } from "./productNormalization";
import { getBrandChartColor } from "./brandAssets";

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

// Time ranges for heatmap (3-hour blocks)
export const TIME_RANGES = [
  { id: 0, label: "08h-10h", start: 8, end: 10 },
  { id: 1, label: "11h-13h", start: 11, end: 13 },
  { id: 2, label: "14h-16h", start: 14, end: 16 },
  { id: 3, label: "17h-19h", start: 17, end: 19 },
  { id: 4, label: "20h-22h", start: 20, end: 22 },
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
      dateDisplay: format(parseISO(date), "dd/MM", { locale: ptBR }),
      revenue: data.revenue,
      count: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Identifica a faixa horária para uma hora específica
 */
function getTimeRangeForHour(hour: number): typeof TIME_RANGES[number] | null {
  return TIME_RANGES.find(range => hour >= range.start && hour <= range.end) || null;
}

/**
 * Agrupa vendas por faixa horária (3h) e dia da semana para heatmap
 */
export function getSalesByHourAndDay(sales: SaleRecord[]): HeatmapCell[] {
  const dataMap = new Map<string, { revenue: number; count: number }>();
  
  // Inicializa todas as células (5 faixas × 7 dias)
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
  
  // Agrupa por faixa horária (3h) em vez de hora individual
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

function getSalesIndex(count: number): 'high' | 'medium' | 'low' | 'none' {
  if (count === 0) return 'none';
  if (count >= 20) return 'high';
  if (count >= 5) return 'medium';
  return 'low';
}

/**
 * Exporta dados para Excel
 */
export function exportToExcel(data: Record<string, any>[], filename: string) {
  // Usa a lib xlsx já instalada
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  });
}
