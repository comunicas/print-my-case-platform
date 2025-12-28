// Layout físico da máquina: 10 andares × 9 colunas
// Andar 1 é especial: apenas slots 01-04 nas colunas 6-9
export const GRID_LAYOUT = [
  { floor: 10, label: "10", slots: ["99", "98", "97", "96", "95", "94", "93", "92", "91"] },
  { floor: 9, label: "9", slots: ["89", "88", "87", "86", "85", "84", "83", "82", "81"] },
  { floor: 8, label: "8", slots: ["79", "78", "77", "76", "75", "74", "73", "72", "71"] },
  { floor: 7, label: "7", slots: ["69", "68", "67", "66", "65", "64", "63", "62", "61"] },
  { floor: 6, label: "6", slots: ["59", "58", "57", "56", "55", "54", "53", "52", "51"] },
  { floor: 5, label: "5", slots: ["49", "48", "47", "46", "45", "44", "43", "42", "41"] },
  { floor: 4, label: "4", slots: ["39", "38", "37", "36", "35", "34", "33", "32", "31"] },
  { floor: 3, label: "3", slots: ["29", "28", "27", "26", "25", "24", "23", "22", "21"] },
  { floor: 2, label: "2", slots: ["19", "18", "17", "16", "15", "14", "13", "12", "11"] },
  { floor: 1, label: "1", slots: [null, null, null, null, null, "04", "03", "02", "01"] },
];

// Colunas da máquina (da esquerda para direita)
export const COLUMN_HEADERS = ["9", "8", "7", "6", "5", "4", "3", "2", "1"];

// Capacidade máxima de cada slot
export const MAX_CAPACITY = 7;

// Thresholds para cores
export const STOCK_THRESHOLDS = {
  EMPTY: 0,
  CRITICAL: 2,
  LOW: 5,
  FULL: 7,
} as const;

export type SlotStatus = 'empty' | 'critical' | 'low' | 'medium' | 'full' | 'inactive';

/**
 * Retorna a classe de cor para um slot baseado na quantidade
 */
export function getSlotColorClass(quantity: number, isActive: boolean = true): string {
  if (!isActive) return 'bg-muted';
  if (quantity === 0) return 'bg-destructive';
  if (quantity <= 2) return 'bg-orange-500';
  if (quantity <= 5) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Retorna a classe de cor para blocos empilhados
 */
export function getBlockColorClass(index: number, quantity: number, isActive: boolean = true): string {
  if (!isActive) return 'bg-muted/30';
  if (index >= quantity) return 'bg-muted/20'; // Bloco vazio
  
  // Blocos preenchidos usam cores baseadas no total
  if (quantity === 0) return 'bg-destructive';
  if (quantity <= 2) return 'bg-orange-500';
  if (quantity <= 5) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Retorna o status textual do slot
 */
export function getSlotStatus(quantity: number, isActive: boolean = true): SlotStatus {
  if (!isActive) return 'inactive';
  if (quantity === 0) return 'empty';
  if (quantity <= 2) return 'critical';
  if (quantity <= 5) return 'low';
  if (quantity < MAX_CAPACITY) return 'medium';
  return 'full';
}

/**
 * Retorna a cor de borda para hover
 */
export function getSlotBorderClass(quantity: number, isActive: boolean = true): string {
  if (!isActive) return 'border-muted';
  if (quantity === 0) return 'border-destructive';
  if (quantity <= 2) return 'border-orange-500';
  if (quantity <= 5) return 'border-yellow-500';
  return 'border-green-500';
}
