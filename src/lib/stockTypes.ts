/**
 * Tipos e constantes centralizados para funcionalidades de estoque
 */

// Capacidade máxima de cada slot
export const MAX_CAPACITY = 7;

// Thresholds para status visual
export const STOCK_THRESHOLDS = {
  EMPTY: 0,
  CRITICAL: 2,
  LOW: 5,
  FULL: 7,
} as const;

/**
 * Status de ação do produto - indica o que fazer com o produto
 * ok: estoque adequado
 * redistribute: redistribuir entre slots
 * restock: repor estoque urgentemente
 */
export type ProductActionStatus = 'ok' | 'redistribute' | 'restock';

/**
 * Status visual do slot - como exibir visualmente o slot
 * Baseado na quantidade atual vs thresholds
 */
export type SlotVisualStatus = 'empty' | 'critical' | 'low' | 'medium' | 'full' | 'inactive';

/**
 * Índice de vendas do produto
 */
export type SalesIndex = 'high' | 'medium' | 'low' | 'none';
