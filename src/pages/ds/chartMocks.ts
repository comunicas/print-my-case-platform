import {
  SalesByDayData,
  HeatmapCell,
  TopProductData,
  StockByBrandData,
  LossesByDayData,
  LowStockItem,
  TIME_RANGES,
} from "@/lib/dashboardUtils";
import { getBrandChartColor } from "@/lib/brandAssets";

// 14 days of sales
export const salesByDayMock: SalesByDayData[] = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const iso = d.toISOString().slice(0, 10);
  const display = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const base = 1200 + Math.round(Math.sin(i * 0.9) * 600 + Math.random() * 400);
  return { date: iso, dateDisplay: display, revenue: base, count: Math.max(1, Math.round(base / 90)) };
});

// Losses (subset of days have losses)
export const lossesByDayMock: LossesByDayData[] = salesByDayMock.map((d, i) => {
  const cancellations = i % 3 === 0 ? Math.round(80 + Math.random() * 120) : 0;
  const refunds = i % 4 === 0 ? Math.round(60 + Math.random() * 90) : 0;
  return {
    date: d.date,
    dateDisplay: d.dateDisplay,
    cancellations,
    cancellationCount: cancellations > 0 ? 1 : 0,
    refunds,
    refundCount: refunds > 0 ? 1 : 0,
    total: cancellations + refunds,
  };
});

export const topProductsMock: TopProductData[] = [
  { name: "iPhone 15 Pro 256GB", revenue: 12480, count: 8, brand: "APPLE" },
  { name: "Galaxy S24 Ultra", revenue: 9870, count: 6, brand: "SAMSUNG" },
  { name: "iPhone 14 128GB", revenue: 8120, count: 9, brand: "APPLE" },
  { name: "Redmi Note 13 Pro", revenue: 5400, count: 12, brand: "XIAOMI" },
  { name: "Galaxy A55", revenue: 4200, count: 7, brand: "SAMSUNG" },
  { name: "iPhone SE", revenue: 3680, count: 5, brand: "APPLE" },
];

export const stockByBrandMock: StockByBrandData[] = [
  { brand: "APPLE", quantity: 28, fill: getBrandChartColor("APPLE") },
  { brand: "SAMSUNG", quantity: 22, fill: getBrandChartColor("SAMSUNG") },
  { brand: "XIAOMI", quantity: 14, fill: getBrandChartColor("XIAOMI") },
  { brand: "OUTROS", quantity: 6, fill: getBrandChartColor("OUTROS") },
];

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const heatmapMock: HeatmapCell[] = TIME_RANGES.flatMap((r) =>
  DAY_NAMES.map((dayName, dayOfWeek) => {
    const intensity = Math.max(0, Math.sin((r.id + dayOfWeek) * 0.7) + Math.random() * 0.6);
    const revenue = Math.round(intensity * 800);
    return {
      rangeId: r.id,
      rangeLabel: r.label,
      dayOfWeek,
      dayName,
      revenue,
      count: revenue > 0 ? Math.max(1, Math.round(revenue / 80)) : 0,
    };
  })
);

export const stockAlertsMock: LowStockItem[] = [
  { slotNumber: "01", productName: "iPhone 15 Pro 256GB", brand: "APPLE", quantity: 1, pdvName: "PDV 01", salesCount: 24, salesIndex: "high" },
  { slotNumber: "07", productName: "Galaxy S24 Ultra", brand: "SAMSUNG", quantity: 2, pdvName: "PDV 01", salesCount: 12, salesIndex: "medium" },
  { slotNumber: "12", productName: "Redmi Note 13", brand: "XIAOMI", quantity: 0, pdvName: "PDV 02", salesCount: 8, salesIndex: "medium" },
  { slotNumber: "18", productName: "iPhone 14", brand: "APPLE", quantity: 1, pdvName: "PDV 02", salesCount: 3, salesIndex: "low" },
];

export const productSalesByDayMock = [
  { day: 0, dayName: "Dom", count: 3, revenue: 1200 },
  { day: 1, dayName: "Seg", count: 8, revenue: 3600 },
  { day: 2, dayName: "Ter", count: 6, revenue: 2400 },
  { day: 3, dayName: "Qua", count: 11, revenue: 4400 },
  { day: 4, dayName: "Qui", count: 9, revenue: 3700 },
  { day: 5, dayName: "Sex", count: 14, revenue: 5800 },
  { day: 6, dayName: "Sáb", count: 12, revenue: 5100 },
];

export const productSalesByHourMock = Array.from({ length: 14 }).map((_, i) => {
  const hour = 8 + i;
  const c = Math.max(0, Math.round(Math.sin(i * 0.5) * 6 + 4 + Math.random() * 2));
  return { hour, count: c, revenue: c * 380 };
});

export const stockHistoryMock = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const iso = d.toISOString().slice(0, 10);
  return {
    date: iso,
    dateDisplay: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    APPLE: 28 + Math.round(Math.sin(i * 0.4) * 4),
    SAMSUNG: 22 + Math.round(Math.cos(i * 0.5) * 3),
    XIAOMI: 14 + Math.round(Math.sin(i * 0.3) * 2),
  };
});