import { MAX_CAPACITY, STOCK_THRESHOLDS, SlotVisualStatus } from './stockTypes';
import { slotBlockColors } from './stockLabels';

// Re-export para compatibilidade
export { MAX_CAPACITY, STOCK_THRESHOLDS };
export type { SlotVisualStatus };

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

/**
 * Retorna o status visual do slot baseado na quantidade
 * Usado para determinar como exibir o slot visualmente
 */
export function getSlotVisualStatus(quantity: number, isActive: boolean = true): SlotVisualStatus {
  if (!isActive) return 'inactive';
  if (quantity === 0) return 'empty';
  if (quantity <= STOCK_THRESHOLDS.CRITICAL) return 'critical';
  if (quantity <= STOCK_THRESHOLDS.LOW) return 'low';
  if (quantity < MAX_CAPACITY) return 'medium';
  return 'full';
}

/**
 * Retorna a classe de cor para blocos empilhados na visualização de slots
 */
export function getBlockColorClass(index: number, quantity: number, isActive: boolean = true): string {
  if (!isActive) return 'bg-muted/30';
  if (index >= quantity) return 'bg-gray-200 dark:bg-gray-700'; // Bloco vazio - cinza claro visível
  
  // Blocos preenchidos usam cores baseadas no status visual
  const status = getSlotVisualStatus(quantity, isActive);
  return slotBlockColors[status] || slotBlockColors.medium;
}
