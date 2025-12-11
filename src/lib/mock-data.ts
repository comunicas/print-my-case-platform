// Centralized mock data for consistency across Dashboard and Reports

export const pdvList = [
  { id: "1", name: "Shopping Ibirapuera", code: "IBR-001" },
  { id: "2", name: "Shopping Morumbi", code: "MRM-002" },
  { id: "3", name: "Shopping Eldorado", code: "ELD-003" },
  { id: "4", name: "Pátio Paulista", code: "PPT-004" },
];

export const products = [
  { id: "1", name: "Capinha iPhone 14", category: "Capinhas", price: 40.0 },
  { id: "2", name: "Carregador USB-C", category: "Carregadores", price: 30.0 },
  { id: "3", name: "Fone Bluetooth", category: "Fones", price: 50.0 },
  { id: "4", name: "Power Bank 10000mAh", category: "Outros", price: 50.0 },
  { id: "5", name: "Capinha Galaxy S23", category: "Capinhas", price: 40.0 },
  { id: "6", name: "Cabo Lightning", category: "Cabos", price: 25.0 },
  { id: "7", name: "Película iPhone", category: "Outros", price: 15.0 },
  { id: "8", name: "Suporte Veicular", category: "Outros", price: 30.0 },
];

export const stockAlerts = {
  rupture: 1,      // Produtos em ruptura (estoque = 0)
  lowStock: 2,     // Produtos com estoque baixo (< 5 unidades)
  stagnant: 2,     // Produtos parados (+30 dias sem venda)
};

export const recentUploads = [
  {
    id: "1",
    type: "sales" as const,
    pdv: "Eldorado",
    date: "2024-12-10",
    status: "processed" as const,
    records: 428,
  },
  {
    id: "2",
    type: "stock" as const,
    pdv: "Ibirapuera",
    date: "2024-12-09",
    status: "processed" as const,
    records: 156,
  },
  {
    id: "3",
    type: "sales" as const,
    pdv: "Morumbi",
    date: "2024-12-08",
    status: "pending" as const,
    records: 312,
  },
];

// Dashboard KPIs
export const dashboardKPIs = {
  totalRevenue: 45231.89,
  transactions: 1234,
  avgTicket: 36.67,
  activePdvs: 4,
  revenueChange: 12.5,
  transactionsChange: 8.2,
  avgTicketChange: 3.1,
};

// Chart data
export const revenueByMonth = [
  { month: "Jul", revenue: 28500 },
  { month: "Ago", revenue: 32100 },
  { month: "Set", revenue: 29800 },
  { month: "Out", revenue: 35200 },
  { month: "Nov", revenue: 38900 },
  { month: "Dez", revenue: 45231 },
];

export const salesByPdv = [
  { pdv: "Ibirapuera", revenue: 12450 },
  { pdv: "Morumbi", revenue: 9230 },
  { pdv: "Eldorado", revenue: 15780 },
  { pdv: "Pátio Paulista", revenue: 7650 },
];

export const paymentMethods = [
  { method: "Pix", value: 45, fill: "hsl(var(--chart-1))" },
  { method: "Crédito", value: 35, fill: "hsl(var(--chart-2))" },
  { method: "Débito", value: 20, fill: "hsl(var(--chart-3))" },
];

export const stockByPdv = [
  { pdv: "Ibirapuera", units: 420 },
  { pdv: "Morumbi", units: 380 },
  { pdv: "Eldorado", units: 510 },
  { pdv: "Pátio Paulista", units: 290 },
];

export const topProducts = [
  { product: "Capinha iPhone 14", quantity: 142 },
  { product: "Carregador USB-C", quantity: 98 },
  { product: "Fone Bluetooth", quantity: 87 },
  { product: "Power Bank", quantity: 76 },
  { product: "Película Samsung", quantity: 65 },
  { product: "Cabo Lightning", quantity: 58 },
  { product: "Suporte Veicular", quantity: 45 },
  { product: "Caixa de Som", quantity: 38 },
];

// Date presets helper
import { subDays, startOfMonth, endOfMonth, subMonths, startOfToday, endOfToday } from "date-fns";

export const datePresets = [
  { 
    label: "Hoje", 
    getDates: () => ({ start: startOfToday(), end: endOfToday() }) 
  },
  { 
    label: "7 dias", 
    getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }) 
  },
  { 
    label: "30 dias", 
    getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }) 
  },
  { 
    label: "Este mês", 
    getDates: () => ({ start: startOfMonth(new Date()), end: new Date() }) 
  },
  { 
    label: "Mês passado", 
    getDates: () => ({ 
      start: startOfMonth(subMonths(new Date(), 1)), 
      end: endOfMonth(subMonths(new Date(), 1)) 
    }) 
  },
];

// Format helpers
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);
