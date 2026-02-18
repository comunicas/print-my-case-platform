import { describe, it, expect } from 'vitest';
import {
  extractBrandFromProductName,
  extractModelFromProductName,
  normalizeProductName,
  matchesProduct,
  getExactProductKey,
  getNormalizedModel,
  filterSalesByProduct,
  countSalesForProduct,
} from '../productNormalization';

describe('extractBrandFromProductName', () => {
  describe('brand at start of name', () => {
    it('should extract APPLE when at start', () => {
      expect(extractBrandFromProductName('APPLE iPhone 16')).toBe('APPLE');
    });

    it('should extract SAMSUNG when at start (case insensitive)', () => {
      expect(extractBrandFromProductName('Samsung Galaxy S24')).toBe('SAMSUNG');
    });

    it('should extract XIAOMI when at start', () => {
      expect(extractBrandFromProductName('XIAOMI Redmi Note 13')).toBe('XIAOMI');
    });

    it('should extract MOTOROLA when at start', () => {
      expect(extractBrandFromProductName('MOTOROLA Moto G84')).toBe('MOTOROLA');
    });
  });

  describe('detect brand by product line', () => {
    it('should detect APPLE from iPhone', () => {
      expect(extractBrandFromProductName('iPhone 16 Pro Max')).toBe('APPLE');
    });

    it('should detect APPLE from iPad', () => {
      expect(extractBrandFromProductName('iPad Pro 12.9')).toBe('APPLE');
    });

    it('should detect APPLE from MacBook', () => {
      expect(extractBrandFromProductName('MacBook Air M3')).toBe('APPLE');
    });

    it('should detect SAMSUNG from Galaxy', () => {
      expect(extractBrandFromProductName('Galaxy S24 Ultra')).toBe('SAMSUNG');
    });

    it('should detect XIAOMI from Redmi', () => {
      expect(extractBrandFromProductName('Redmi Note 13 Pro')).toBe('XIAOMI');
    });

    it('should detect XIAOMI from Poco', () => {
      expect(extractBrandFromProductName('Poco X6 Pro')).toBe('XIAOMI');
    });

    it('should detect MOTOROLA from Moto', () => {
      expect(extractBrandFromProductName('Moto G84 5G')).toBe('MOTOROLA');
    });
  });

  describe('unknown brands', () => {
    it('should return first word for LG', () => {
      expect(extractBrandFromProductName('LG K62')).toBe('LG');
    });

    it('should return first word for Nokia', () => {
      expect(extractBrandFromProductName('Nokia G42 5G')).toBe('NOKIA');
    });
  });

  describe('edge cases', () => {
    it('should return UNKNOWN for empty string', () => {
      expect(extractBrandFromProductName('')).toBe('UNKNOWN');
    });

    it('should return UNKNOWN for whitespace only', () => {
      expect(extractBrandFromProductName('   ')).toBe('UNKNOWN');
    });

    it('should handle brand name only', () => {
      expect(extractBrandFromProductName('APPLE')).toBe('APPLE');
    });
  });
});

describe('extractModelFromProductName', () => {
  it('should remove APPLE from start', () => {
    expect(extractModelFromProductName('APPLE iPhone 16')).toBe('iPhone 16');
  });

  it('should remove SAMSUNG from start', () => {
    expect(extractModelFromProductName('SAMSUNG Galaxy S24')).toBe('Galaxy S24');
  });

  it('should remove XIAOMI from start', () => {
    expect(extractModelFromProductName('XIAOMI Redmi Note 13')).toBe('Redmi Note 13');
  });

  it('should remove MOTOROLA from start', () => {
    expect(extractModelFromProductName('MOTOROLA Moto G84')).toBe('Moto G84');
  });

  it('should preserve original case of model', () => {
    expect(extractModelFromProductName('APPLE iPhone 16 Pro Max')).toBe('iPhone 16 Pro Max');
  });

  it('should return full name if no known brand at start', () => {
    expect(extractModelFromProductName('iPhone 16')).toBe('iPhone 16');
  });

  it('should return full name for unknown brand', () => {
    expect(extractModelFromProductName('LG K62')).toBe('LG K62');
  });

  it('should handle whitespace', () => {
    expect(extractModelFromProductName('  APPLE iPhone 16  ')).toBe('iPhone 16');
  });
});

describe('normalizeProductName', () => {
  it('should convert to lowercase', () => {
    expect(normalizeProductName('iPhone 16 Pro')).toBe('iphone 16 pro');
  });

  it('should remove extra spaces', () => {
    expect(normalizeProductName('iPhone   16   Pro')).toBe('iphone 16 pro');
  });

  it('should remove special characters', () => {
    // '_' é removido; '-' é preservado para distinguir modelos (ex: Pro-Max)
    // '!' é removido como caracter sem sentido em nomes de produto
    expect(normalizeProductName('iPhone-16_Pro!')).toBe('iphone-16pro');
  });

  it('should trim whitespace', () => {
    expect(normalizeProductName('  iPhone 16  ')).toBe('iphone 16');
  });

  it('should handle complex names', () => {
    // '+' é preservado (distingue Galaxy S24 de S24+); parênteses são removidos
    expect(normalizeProductName('Galaxy S24+ Ultra (256GB)')).toBe('galaxy s24+ ultra 256gb');
  });
});

describe('matchesProduct', () => {
  describe('should match same model', () => {
    it('with brand prefix on first', () => {
      expect(matchesProduct('APPLE iPhone 16', 'iPhone 16')).toBe(true);
    });

    it('with brand prefix on second', () => {
      expect(matchesProduct('iPhone 16', 'APPLE iPhone 16')).toBe(true);
    });

    it('with brand prefix on both', () => {
      expect(matchesProduct('APPLE iPhone 16', 'APPLE iPhone 16')).toBe(true);
    });

    it('case insensitive', () => {
      expect(matchesProduct('iphone 16', 'IPHONE 16')).toBe(true);
    });
  });

  describe('CRITICAL: should NOT match different models', () => {
    it('iPhone 15 vs iPhone 15 Pro', () => {
      expect(matchesProduct('iPhone 15', 'iPhone 15 Pro')).toBe(false);
    });

    it('iPhone 15 Pro vs iPhone 15 Pro Max', () => {
      expect(matchesProduct('iPhone 15 Pro', 'iPhone 15 Pro Max')).toBe(false);
    });

    it('Galaxy S24 vs Galaxy S24 Ultra', () => {
      expect(matchesProduct('Galaxy S24', 'Galaxy S24 Ultra')).toBe(false);
    });

    it('Galaxy S24 vs Galaxy S24+', () => {
      expect(matchesProduct('Galaxy S24', 'Galaxy S24+')).toBe(false);
    });

    it('Redmi Note 13 vs Redmi Note 13 Pro', () => {
      expect(matchesProduct('Redmi Note 13', 'Redmi Note 13 Pro')).toBe(false);
    });

    it('completely different products', () => {
      expect(matchesProduct('iPhone 16', 'Galaxy S24')).toBe(false);
    });
  });
});

describe('getExactProductKey', () => {
  it('should create key with brand:model format', () => {
    expect(getExactProductKey('APPLE iPhone 16')).toBe('APPLE:iphone 16');
  });

  it('should detect brand from product line', () => {
    expect(getExactProductKey('iPhone 16')).toBe('APPLE:iphone 16');
  });

  it('should handle Samsung', () => {
    expect(getExactProductKey('SAMSUNG Galaxy S24')).toBe('SAMSUNG:galaxy s24');
  });

  it('should handle Xiaomi aliases', () => {
    expect(getExactProductKey('Redmi Note 13')).toBe('XIAOMI:redmi note 13');
  });

  describe('CRITICAL: different keys for different models', () => {
    it('iPhone 15 vs iPhone 15 Pro', () => {
      const key1 = getExactProductKey('iPhone 15');
      const key2 = getExactProductKey('iPhone 15 Pro');
      expect(key1).not.toBe(key2);
    });

    it('iPhone 15 Pro vs iPhone 15 Pro Max', () => {
      const key2 = getExactProductKey('iPhone 15 Pro');
      const key3 = getExactProductKey('iPhone 15 Pro Max');
      expect(key2).not.toBe(key3);
    });

    it('all three iPhone 15 variants have different keys', () => {
      const key1 = getExactProductKey('iPhone 15');
      const key2 = getExactProductKey('iPhone 15 Pro');
      const key3 = getExactProductKey('iPhone 15 Pro Max');
      expect(new Set([key1, key2, key3]).size).toBe(3);
    });
  });

  it('should normalize spaces in model', () => {
    expect(getExactProductKey('iPhone  16   Pro')).toBe('APPLE:iphone 16 pro');
  });

  it('should trim whitespace', () => {
    expect(getExactProductKey('  iPhone 16  ')).toBe('APPLE:iphone 16');
  });
});

describe('getNormalizedModel', () => {
  it('should normalize model from full product name', () => {
    expect(getNormalizedModel('APPLE iPhone 16 Pro')).toBe('iphone 16 pro');
  });

  it('should normalize model without brand prefix', () => {
    expect(getNormalizedModel('iPhone 16 Pro')).toBe('iphone 16 pro');
  });

  it('should normalize extra spaces', () => {
    expect(getNormalizedModel('APPLE iPhone  16   Pro')).toBe('iphone 16 pro');
  });

  it('should return empty string for empty input', () => {
    expect(getNormalizedModel('')).toBe('');
  });

  it('should handle Samsung', () => {
    expect(getNormalizedModel('SAMSUNG Galaxy S24 Ultra')).toBe('galaxy s24 ultra');
  });
});

describe('filterSalesByProduct', () => {
  const mockSales = [
    { product_name: 'APPLE iPhone 16', amount: 100 },
    { product_name: 'iPhone 16', amount: 200 },
    { product_name: 'APPLE iPhone 16 Pro', amount: 300 },
    { product_name: 'SAMSUNG Galaxy S24', amount: 400 },
  ];

  it('should filter sales matching product model exactly', () => {
    const result = filterSalesByProduct(mockSales, 'APPLE iPhone 16');
    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(100);
    expect(result[1].amount).toBe(200);
  });

  it('should NOT include similar but different models', () => {
    const result = filterSalesByProduct(mockSales, 'iPhone 16');
    expect(result).toHaveLength(2);
    // Should NOT include iPhone 16 Pro
    expect(result.every(s => !s.product_name.includes('Pro'))).toBe(true);
  });

  it('should handle brand in target name', () => {
    const result = filterSalesByProduct(mockSales, 'iPhone 16 Pro');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(300);
  });

  it('should return empty array for no matches', () => {
    const result = filterSalesByProduct(mockSales, 'Nokia 3310');
    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty target', () => {
    const result = filterSalesByProduct(mockSales, '');
    expect(result).toHaveLength(0);
  });
});

describe('countSalesForProduct', () => {
  const salesMap = new Map<string, number>([
    ['APPLE iPhone 16', 10],
    ['iPhone 16 Pro', 5],
    ['SAMSUNG Galaxy S24', 8],
  ]);

  it('should count sales matching product model exactly', () => {
    expect(countSalesForProduct('iPhone 16', salesMap)).toBe(10);
  });

  it('should count with brand prefix', () => {
    expect(countSalesForProduct('APPLE iPhone 16', salesMap)).toBe(10);
  });

  it('should NOT count similar but different models', () => {
    // iPhone 16 should NOT match iPhone 16 Pro
    expect(countSalesForProduct('iPhone 16', salesMap)).toBe(10);
    expect(countSalesForProduct('iPhone 16 Pro', salesMap)).toBe(5);
  });

  it('should return 0 for no matches', () => {
    expect(countSalesForProduct('Nokia 3310', salesMap)).toBe(0);
  });

  it('should return 0 for empty product name', () => {
    expect(countSalesForProduct('', salesMap)).toBe(0);
  });
});

// ===== filterSalesByProduct — sufixos críticos + e - =====

describe('filterSalesByProduct — CRÍTICO: sufixos + e - distinguem modelos', () => {
  /**
   * Dataset realista: simula product_name no formato exato retornado pelo banco
   * (ex: "SAMSUNG Galaxy S24+", "Samsung Galaxy S24", em uppercase ou mixed case)
   */
  const salesWithSuffixes = [
    { product_name: 'SAMSUNG Galaxy S24',       amount: 100 },
    { product_name: 'SAMSUNG Galaxy S24+',      amount: 200 },
    { product_name: 'SAMSUNG Galaxy S24 Ultra', amount: 300 },
    { product_name: 'Galaxy S24',               amount: 400 },  // sem marca
    { product_name: 'Galaxy S24+',              amount: 500 },  // sem marca
    { product_name: 'APPLE iPhone 15',          amount: 600 },
    { product_name: 'APPLE iPhone 15 Pro',      amount: 700 },
    { product_name: 'APPLE iPhone 15 Pro Max',  amount: 800 },
    { product_name: 'iPhone 15 Pro-Max',        amount: 900 },  // formato com hífen
  ];

  describe('Galaxy S24 vs Galaxy S24+', () => {
    it('Galaxy S24 NÃO deve incluir Galaxy S24+ (caso real do code review)', () => {
      const result = filterSalesByProduct(salesWithSuffixes, 'Galaxy S24');
      const names = result.map(s => s.product_name);

      // Deve incluir apenas os S24 sem sufixo
      expect(names).toContain('SAMSUNG Galaxy S24');
      expect(names).toContain('Galaxy S24');

      // NÃO deve incluir S24+ nem S24 Ultra
      expect(names).not.toContain('SAMSUNG Galaxy S24+');
      expect(names).not.toContain('Galaxy S24+');
      expect(names).not.toContain('SAMSUNG Galaxy S24 Ultra');
    });

    it('Galaxy S24+ SÓ deve incluir Galaxy S24+ (mesmo modelo, com e sem marca)', () => {
      const result = filterSalesByProduct(salesWithSuffixes, 'Galaxy S24+');
      const names = result.map(s => s.product_name);

      expect(names).toContain('SAMSUNG Galaxy S24+');
      expect(names).toContain('Galaxy S24+');

      // NÃO deve incluir S24 sem plus, nem Ultra
      expect(names).not.toContain('SAMSUNG Galaxy S24');
      expect(names).not.toContain('Galaxy S24');
      expect(names).not.toContain('SAMSUNG Galaxy S24 Ultra');
    });

    it('Galaxy S24 Ultra não deve confundir com Galaxy S24', () => {
      const result = filterSalesByProduct(salesWithSuffixes, 'Galaxy S24 Ultra');
      const names = result.map(s => s.product_name);

      expect(names).toContain('SAMSUNG Galaxy S24 Ultra');
      expect(names).not.toContain('SAMSUNG Galaxy S24');
      expect(names).not.toContain('SAMSUNG Galaxy S24+');
    });
  });

  describe('Galaxy S24+ com nome do banco em uppercase', () => {
    it('SAMSUNG Galaxy S24+ (banco) deve bater com Galaxy S24+ (referência sem marca)', () => {
      const bankData = [{ product_name: 'SAMSUNG Galaxy S24+', amount: 999 }];
      const result = filterSalesByProduct(bankData, 'Galaxy S24+');
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(999);
    });

    it('SAMSUNG Galaxy S24 (banco) NÃO deve bater com Galaxy S24+', () => {
      const bankData = [{ product_name: 'SAMSUNG Galaxy S24', amount: 999 }];
      const result = filterSalesByProduct(bankData, 'Galaxy S24+');
      expect(result).toHaveLength(0);
    });
  });

  describe('iPhone 15 vs iPhone 15 Pro vs iPhone 15 Pro Max', () => {
    it('iPhone 15 não deve incluir iPhone 15 Pro', () => {
      const result = filterSalesByProduct(salesWithSuffixes, 'iPhone 15');
      const names = result.map(s => s.product_name);

      expect(names).toContain('APPLE iPhone 15');
      expect(names).not.toContain('APPLE iPhone 15 Pro');
      expect(names).not.toContain('APPLE iPhone 15 Pro Max');
    });

    it('iPhone 15 Pro não deve incluir iPhone 15 Pro Max', () => {
      const result = filterSalesByProduct(salesWithSuffixes, 'iPhone 15 Pro');
      const names = result.map(s => s.product_name);

      expect(names).toContain('APPLE iPhone 15 Pro');
      expect(names).not.toContain('APPLE iPhone 15');
      expect(names).not.toContain('APPLE iPhone 15 Pro Max');
    });

    it('iPhone 15 Pro-Max (com hífen) não deve bater com iPhone 15 Pro', () => {
      const result = filterSalesByProduct(salesWithSuffixes, 'iPhone 15 Pro');
      const names = result.map(s => s.product_name);

      // "iPhone 15 Pro-Max" normaliza para "iphone 15 pro-max" (hífen preservado como separador de modelo)
      // portanto NÃO deve bater com "iphone 15 pro"
      expect(names).not.toContain('iPhone 15 Pro-Max');
    });
  });

  describe('formato exato do banco — dados de useProductAnalytics', () => {
    it('deve retornar todos os registros quando o produto é exato e há vários PDVs', () => {
      const multiPdvData = [
        { product_name: 'SAMSUNG Galaxy S24+', amount: 100, pdv_id: 'pdv-1' },
        { product_name: 'SAMSUNG Galaxy S24+', amount: 200, pdv_id: 'pdv-2' },
        { product_name: 'SAMSUNG Galaxy S24',  amount: 300, pdv_id: 'pdv-1' },
      ];

      const result = filterSalesByProduct(multiPdvData, 'SAMSUNG Galaxy S24+');
      expect(result).toHaveLength(2);
      expect(result.every(r => r.product_name === 'SAMSUNG Galaxy S24+')).toBe(true);
    });

    it('deve funcionar com product_name em caixa baixa (normalização)', () => {
      const lowerCaseData = [{ product_name: 'samsung galaxy s24+', amount: 150 }];
      const result = filterSalesByProduct(lowerCaseData, 'Galaxy S24+');
      expect(result).toHaveLength(1);
    });

    it('deve retornar array vazio para produto inexistente', () => {
      const result = filterSalesByProduct(salesWithSuffixes, 'Motorola Edge 50');
      expect(result).toHaveLength(0);
    });
  });
});

