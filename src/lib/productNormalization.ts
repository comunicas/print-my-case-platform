import { KNOWN_BRANDS, BRAND_ALIASES, getCanonicalBrand } from './brandAssets';

/**
 * Extrai a marca do nome completo do produto
 * Ex: "APPLE iPhone 17" → "APPLE"
 * Ex: "iPhone 17" → "APPLE" (detecta pela linha de produto)
 */
export function extractBrandFromProductName(fullName: string): string {
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
  const upper = fullName.toUpperCase().trim();
  
  // Remove marcas conhecidas do início
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
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/**
 * Verifica se dois nomes são do mesmo produto (matching fuzzy)
 */
export function matchesProduct(name1: string, name2: string): boolean {
  const n1 = normalizeProductName(name1);
  const n2 = normalizeProductName(name2);
  
  // Match exato
  if (n1 === n2) return true;
  
  // Extrai modelo de ambos e compara
  const model1 = normalizeProductName(extractModelFromProductName(name1));
  const model2 = normalizeProductName(extractModelFromProductName(name2));
  
  if (model1 === model2) return true;
  
  // Verifica se um contém o outro
  if (n1.includes(n2) || n2.includes(n1)) return true;
  if (model1.includes(model2) || model2.includes(model1)) return true;
  
  return false;
}

/**
 * Cria uma chave única para agrupar produtos
 */
export function getProductKey(productName: string): string {
  const brand = extractBrandFromProductName(productName);
  const model = normalizeProductName(extractModelFromProductName(productName));
  return `${brand}:${model}`;
}
