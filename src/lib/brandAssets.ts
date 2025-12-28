import appleLogo from '@/assets/brands/apple.png';
import samsungLogo from '@/assets/brands/samsung.png';
import xiaomiLogo from '@/assets/brands/xiaomi.png';
import motorolaLogo from '@/assets/brands/motorola.png';

// Mapeamento de marcas canônicas para logos
export const BRAND_LOGOS: Record<string, string> = {
  APPLE: appleLogo,
  SAMSUNG: samsungLogo,
  XIAOMI: xiaomiLogo,
  MOTOROLA: motorolaLogo,
};

// Cores para fallback quando não há logo
export const BRAND_COLORS: Record<string, string> = {
  APPLE: 'hsl(0, 0%, 20%)',
  SAMSUNG: 'hsl(220, 80%, 50%)',
  XIAOMI: 'hsl(25, 90%, 55%)',
  MOTOROLA: 'hsl(200, 70%, 45%)',
};

// Aliases para normalização (dados de vendas usam nomes diferentes)
export const BRAND_ALIASES: Record<string, string> = {
  IPHONE: 'APPLE',
  GALAXY: 'SAMSUNG',
  REDMI: 'XIAOMI',
  MOTO: 'MOTOROLA',
  MI: 'XIAOMI',
  POCO: 'XIAOMI',
};

// Lista de marcas conhecidas
export const KNOWN_BRANDS = ['APPLE', 'SAMSUNG', 'XIAOMI', 'MOTOROLA'];

/**
 * Retorna a marca canônica a partir de um nome (resolve aliases)
 */
export function getCanonicalBrand(brand: string): string {
  const upper = brand.toUpperCase().trim();
  
  // Verifica se é uma marca conhecida
  if (KNOWN_BRANDS.includes(upper)) {
    return upper;
  }
  
  // Verifica aliases
  if (BRAND_ALIASES[upper]) {
    return BRAND_ALIASES[upper];
  }
  
  // Verifica se começa com algum alias
  for (const [alias, canonical] of Object.entries(BRAND_ALIASES)) {
    if (upper.startsWith(alias)) {
      return canonical;
    }
  }
  
  return upper;
}

/**
 * Retorna o path do logo da marca, ou null se não encontrado
 */
export function getBrandLogo(brand: string): string | null {
  const canonical = getCanonicalBrand(brand);
  return BRAND_LOGOS[canonical] || null;
}

/**
 * Retorna a cor da marca para fallback
 */
export function getBrandColor(brand: string): string {
  const canonical = getCanonicalBrand(brand);
  return BRAND_COLORS[canonical] || 'hsl(var(--muted-foreground))';
}
