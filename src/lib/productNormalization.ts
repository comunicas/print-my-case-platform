import { KNOWN_BRANDS, BRAND_ALIASES, getCanonicalBrand } from './brandAssets';

/**
 * Extrai a marca do nome completo do produto
 * Ex: "APPLE iPhone 17" → "APPLE"
 * Ex: "iPhone 17" → "APPLE" (detecta pela linha de produto)
 */
export function extractBrandFromProductName(fullName: string): string {
  if (!fullName) return 'UNKNOWN';
  const upper = fullName.toUpperCase().trim();
  
  // Primeiro verifica se começa com uma marca conhecida
  for (const brand of KNOWN_BRANDS) {
    if (upper.startsWith(brand + ' ') || upper === brand) {
      return brand;
    }
  }
  
  // Verifica se começa com algum alias
  for (const [alias, canonical] of Object.entries(BRAND_ALIASES)) {
    if (upper.startsWith(alias + ' ') || upper.startsWith(alias)) {
      return canonical;
    }
  }
  
  // Verifica se contém alguma linha de produto conhecida
  const productLines: Record<string, string> = {
    'IPHONE': 'APPLE',
    'MACBOOK': 'APPLE',
    'IPAD': 'APPLE',
    'AIRPODS': 'APPLE',
    'GALAXY': 'SAMSUNG',
    'REDMI': 'XIAOMI',
    'POCO': 'XIAOMI',
    'MI ': 'XIAOMI',
    'MOTO ': 'MOTOROLA',
    'MOTOROLA': 'MOTOROLA',
  };
  
  for (const [line, brand] of Object.entries(productLines)) {
    if (upper.includes(line)) {
      return brand;
    }
  }
  
  // Retorna a primeira palavra como marca desconhecida
  const firstWord = upper.split(' ')[0];
  return firstWord || 'UNKNOWN';
}

/**
 * Extrai o modelo do nome completo (remove a marca)
 * Ex: "APPLE iPhone 17" → "iPhone 17"
 * Ex: "iPhone 17" → "iPhone 17"
 */
export function extractModelFromProductName(fullName: string): string {
  if (!fullName) return '';
  
  // Verifica se é um productKey no formato "BRAND:model"
  if (fullName.includes(':')) {
    const parts = fullName.split(':');
    if (parts.length >= 2) {
      // Retorna a parte após o primeiro ":"
      return parts.slice(1).join(':').trim();
    }
  }
  
  const upper = fullName.toUpperCase().trim();
  
  // Remove marcas conhecidas do início (formato "BRAND model")
  for (const brand of KNOWN_BRANDS) {
    if (upper.startsWith(brand + ' ')) {
      return fullName.trim().substring(brand.length + 1).trim();
    }
  }
  
  return fullName.trim();
}

/**
 * Normaliza o nome do produto para matching entre stock e sales
 * Remove espaços extras, padroniza case, remove caracteres especiais
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    // Remove apenas chars que NÃO são letra, dígito, espaço ou sufixos de modelo (+, -)
    // Preserva '+' e '-' pois distinguem modelos (Galaxy S24 vs S24+)
    .replace(/[^\w\s+\-]/g, '')
    // Remove underscores (não fazem parte de nomes de modelo)
    .replace(/_/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se dois nomes são do mesmo produto (matching exato por modelo)
 */
export function matchesProduct(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  const model1 = normalizeProductName(extractModelFromProductName(name1));
  const model2 = normalizeProductName(extractModelFromProductName(name2));
  
  // Match exato do modelo apenas
  return model1 === model2;
}

/**
 * Cria uma chave única para agrupar produtos (mantém distinção completa do modelo)
 * Ex: "APPLE iPhone 15 Pro" → "APPLE:iphone 15 pro"
 * Ex: "APPLE iPhone 15" → "APPLE:iphone 15"
 */
export function getExactProductKey(productName: string): string {
  if (!productName) return 'UNKNOWN:';
  const brand = extractBrandFromProductName(productName);
  const model = extractModelFromProductName(productName)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  return `${brand}:${model}`;
}

/**
 * Retorna o modelo normalizado para matching
 * Centraliza a lógica de normalização usada em todos os hooks
 */
export function getNormalizedModel(productName: string): string {
  if (!productName) return '';
  return extractModelFromProductName(productName)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Filtra array de vendas que correspondem ao produto
 * Útil para filtrar resultados de queries do Supabase
 */
export function filterSalesByProduct<T extends { product_name: string }>(
  sales: T[],
  targetProductName: string
): T[] {
  const targetModel = getNormalizedModel(targetProductName);
  if (!targetModel) return [];
  
  return sales.filter(sale => {
    const saleModel = getNormalizedModel(sale.product_name);
    return saleModel === targetModel;
  });
}

/**
 * Conta vendas de um produto em um Map de vendas por nome
 */
export function countSalesForProduct(
  productName: string,
  salesByProduct: Map<string, number>
): number {
  const targetModel = getNormalizedModel(productName);
  if (!targetModel) return 0;
  
  for (const [salesProduct, count] of salesByProduct.entries()) {
    if (getNormalizedModel(salesProduct) === targetModel) {
      return count;
    }
  }
  return 0;
}

