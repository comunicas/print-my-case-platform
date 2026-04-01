import { getExactProductKey, countSalesForProduct } from './productNormalization';
import { MAX_CAPACITY, ProductActionStatus, SalesIndex } from './stockTypes';

// Re-exports para compatibilidade
export type { ProductActionStatus, SalesIndex };

/**
 * Determina o status de ação de um slot individual baseado na quantidade
 * Indica o que deve ser feito: ok, redistribuir ou repor
 */
export function getProductActionStatus(quantity: number): ProductActionStatus {
  if (quantity === 0) return 'restock';
  if (quantity <= 2) return 'warning';
  if (quantity <= 4) return 'monitor';
  return 'perfect';
}

/**
 * Verifica se um produto/slot corresponde ao termo de busca
 */
export function matchesSearchFilter(
  term: string,
  productName: string,
  model: string,
  exactModelMatch: boolean
): boolean {
  const modelLower = model.toLowerCase().trim();
  const productLower = productName.toLowerCase().trim();
  
  if (exactModelMatch) {
    return modelLower === term || productLower === term;
  }
  return modelLower.includes(term) || productLower.includes(term);
}

export interface SlotData {
  id: string;
  slot: string;           // "34"
  productName: string;    // "APPLE iPhone 17"
  brand: string;          // "APPLE" (extraído)
  model: string;          // "iPhone 17" (extraído)
  quantity: number;       // 0-7
  pdvId: string;
  pdvName?: string;
  isActive: boolean;
}

export interface ProductStock {
  productKey: string;     // Chave única para agrupar
  productName: string;    // "APPLE iPhone 17"
  brand: string;          // "APPLE"
  model: string;          // "iPhone 17"
  slots: { slotNumber: string; quantity: number; pdvId: string }[];
  totalQuantity: number;
  maxCapacity: number;
  totalSold: number;
  hasOutOfStock: boolean;
  hasLowStock: boolean;
  status: ProductActionStatus;
  salesIndex: SalesIndex;
}

export interface StockKPIs {
  totalProducts: number;
  totalUnits: number;
  criticalProducts: number;
  redistributeProducts: number;
  occupiedSlots: number;
  emptySlots: number;
}

/**
 * Agrega slots por produto, combinando com dados de vendas
 */
export function aggregateProductStock(
  slots: SlotData[], 
  salesByProduct: Map<string, number>
): ProductStock[] {
  const productMap = new Map<string, ProductStock>();
  
  for (const slot of slots) {
    if (!slot.isActive) continue;
    
    const key = getExactProductKey(slot.productName);
    
    if (!productMap.has(key)) {
      const totalSold = countSalesForProduct(slot.productName, salesByProduct);
      
      productMap.set(key, {
        productKey: key,
        productName: slot.productName,
        brand: slot.brand,
        model: slot.model,
        slots: [],
        totalQuantity: 0,
        maxCapacity: 0,
        totalSold,
        hasOutOfStock: false,
        hasLowStock: false,
        status: 'ok',
        salesIndex: getSalesIndex(totalSold),
      });
    }
    
    const product = productMap.get(key)!;
    product.slots.push({
      slotNumber: slot.slot,
      quantity: slot.quantity,
      pdvId: slot.pdvId,
    });
    product.totalQuantity += slot.quantity;
    product.maxCapacity += MAX_CAPACITY;
    
    if (slot.quantity === 0) product.hasOutOfStock = true;
    if (slot.quantity <= 2) product.hasLowStock = true;
  }
  
  // Calcula status para cada produto
  for (const product of productMap.values()) {
    product.status = getProductStatus(product);
  }
  
  return Array.from(productMap.values());
}

/**
 * Determina o status do produto baseado em slots
 */
export function getProductStatus(product: ProductStock): ProductActionStatus {
  // Estoque total <= 2: repor se vende, ok se não vende
  if (product.totalQuantity <= 2) {
    if (product.salesIndex === 'none') return 'ok';
    return 'restock';
  }
  // Tem slot vazio mas estoque total > 2: redistribuir
  if (product.hasOutOfStock) return 'redistribute';
  return 'ok';
}

/**
 * Determina o índice de vendas do produto
 */
export function getSalesIndex(totalSold: number): SalesIndex {
  if (totalSold === 0) return 'none';
  if (totalSold >= 20) return 'high';
  if (totalSold >= 5) return 'medium';
  return 'low';
}

/**
 * Calcula KPIs gerais do estoque
 */
export function calculateStockKPIs(products: ProductStock[], totalSlots: number): StockKPIs {
  const occupiedSlots = products.reduce((acc, p) => acc + p.slots.length, 0);
  
  return {
    totalProducts: products.length,
    totalUnits: products.reduce((acc, p) => acc + p.totalQuantity, 0),
    criticalProducts: products.filter(p => p.status === 'restock').length,
    redistributeProducts: products.filter(p => p.status === 'redistribute').length,
    occupiedSlots,
    emptySlots: totalSlots - occupiedSlots,
  };
}

/**
 * Extrai marcas únicas de uma lista de slots
 */
export function extractUniqueBrands(slots: SlotData[]): string[] {
  const brands = new Set<string>();
  for (const slot of slots) {
    if (slot.brand) brands.add(slot.brand);
  }
  return Array.from(brands).sort();
}
