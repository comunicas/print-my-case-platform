import { describe, it, expect } from 'vitest';
import {
  getCanonicalBrand,
  getBrandChartColor,
  getBrandColor,
  getBrandLogo,
  KNOWN_BRANDS,
  BRAND_ALIASES,
  BRAND_CHART_COLORS,
  BRAND_COLORS,
} from '../brandAssets';

describe('KNOWN_BRANDS', () => {
  it('should contain all major brands', () => {
    expect(KNOWN_BRANDS).toContain('APPLE');
    expect(KNOWN_BRANDS).toContain('SAMSUNG');
    expect(KNOWN_BRANDS).toContain('XIAOMI');
    expect(KNOWN_BRANDS).toContain('MOTOROLA');
  });
});

describe('BRAND_ALIASES', () => {
  it('should map iPhone to APPLE', () => {
    expect(BRAND_ALIASES['IPHONE']).toBe('APPLE');
  });

  it('should map Galaxy to SAMSUNG', () => {
    expect(BRAND_ALIASES['GALAXY']).toBe('SAMSUNG');
  });

  it('should map Redmi, Poco, Mi to XIAOMI', () => {
    expect(BRAND_ALIASES['REDMI']).toBe('XIAOMI');
    expect(BRAND_ALIASES['POCO']).toBe('XIAOMI');
    expect(BRAND_ALIASES['MI']).toBe('XIAOMI');
  });

  it('should map Moto to MOTOROLA', () => {
    expect(BRAND_ALIASES['MOTO']).toBe('MOTOROLA');
  });
});

describe('getCanonicalBrand', () => {
  describe('known brands', () => {
    it('should return same brand for APPLE', () => {
      expect(getCanonicalBrand('APPLE')).toBe('APPLE');
    });

    it('should return same brand for SAMSUNG', () => {
      expect(getCanonicalBrand('SAMSUNG')).toBe('SAMSUNG');
    });

    it('should return same brand for XIAOMI', () => {
      expect(getCanonicalBrand('XIAOMI')).toBe('XIAOMI');
    });

    it('should return same brand for MOTOROLA', () => {
      expect(getCanonicalBrand('MOTOROLA')).toBe('MOTOROLA');
    });
  });

  describe('aliases resolution', () => {
    it('should resolve IPHONE to APPLE', () => {
      expect(getCanonicalBrand('IPHONE')).toBe('APPLE');
    });

    it('should resolve GALAXY to SAMSUNG', () => {
      expect(getCanonicalBrand('GALAXY')).toBe('SAMSUNG');
    });

    it('should resolve REDMI to XIAOMI', () => {
      expect(getCanonicalBrand('REDMI')).toBe('XIAOMI');
    });

    it('should resolve POCO to XIAOMI', () => {
      expect(getCanonicalBrand('POCO')).toBe('XIAOMI');
    });

    it('should resolve MOTO to MOTOROLA', () => {
      expect(getCanonicalBrand('MOTO')).toBe('MOTOROLA');
    });
  });

  describe('case insensitivity', () => {
    it('should handle lowercase apple', () => {
      expect(getCanonicalBrand('apple')).toBe('APPLE');
    });

    it('should handle mixed case Samsung', () => {
      expect(getCanonicalBrand('Samsung')).toBe('SAMSUNG');
    });

    it('should handle lowercase iphone alias', () => {
      expect(getCanonicalBrand('iphone')).toBe('APPLE');
    });
  });

  describe('prefix matching', () => {
    it('should match IPHONE prefix', () => {
      expect(getCanonicalBrand('IPHONE16')).toBe('APPLE');
    });

    it('should match GALAXY prefix', () => {
      expect(getCanonicalBrand('GALAXYS24')).toBe('SAMSUNG');
    });
  });

  describe('unknown brands', () => {
    it('should return uppercase for lg', () => {
      expect(getCanonicalBrand('lg')).toBe('LG');
    });

    it('should return uppercase for nokia', () => {
      expect(getCanonicalBrand('nokia')).toBe('NOKIA');
    });

    it('should handle whitespace', () => {
      expect(getCanonicalBrand('  apple  ')).toBe('APPLE');
    });
  });
});

describe('getBrandChartColor', () => {
  it('should return purple for APPLE', () => {
    expect(getBrandChartColor('APPLE')).toBe('hsl(271, 81%, 56%)');
  });

  it('should return green for SAMSUNG', () => {
    expect(getBrandChartColor('SAMSUNG')).toBe('hsl(142, 71%, 45%)');
  });

  it('should return blue for XIAOMI', () => {
    expect(getBrandChartColor('XIAOMI')).toBe('hsl(221, 83%, 53%)');
  });

  it('should return orange for MOTOROLA', () => {
    expect(getBrandChartColor('MOTOROLA')).toBe('hsl(38, 92%, 50%)');
  });

  it('should return pink for REALME', () => {
    expect(getBrandChartColor('REALME')).toBe('hsl(340, 75%, 55%)');
  });

  it('should return fallback gray for unknown brands', () => {
    expect(getBrandChartColor('UNKNOWN_BRAND')).toBe('hsl(215, 16%, 47%)');
  });

  it('should resolve aliases before getting color', () => {
    expect(getBrandChartColor('IPHONE')).toBe(getBrandChartColor('APPLE'));
    expect(getBrandChartColor('GALAXY')).toBe(getBrandChartColor('SAMSUNG'));
  });
});

describe('getBrandColor', () => {
  it('should return dark gray for APPLE', () => {
    expect(getBrandColor('APPLE')).toBe('hsl(0, 0%, 20%)');
  });

  it('should return blue for SAMSUNG', () => {
    expect(getBrandColor('SAMSUNG')).toBe('hsl(220, 80%, 50%)');
  });

  it('should return orange for XIAOMI', () => {
    expect(getBrandColor('XIAOMI')).toBe('hsl(25, 90%, 55%)');
  });

  it('should return teal for MOTOROLA', () => {
    expect(getBrandColor('MOTOROLA')).toBe('hsl(200, 70%, 45%)');
  });

  it('should return muted color for unknown brands', () => {
    expect(getBrandColor('UNKNOWN')).toBe('hsl(var(--muted-foreground))');
  });

  it('should resolve aliases', () => {
    expect(getBrandColor('IPHONE')).toBe(getBrandColor('APPLE'));
  });
});

describe('getBrandLogo', () => {
  it('should return logo path for known brands', () => {
    expect(getBrandLogo('APPLE')).not.toBeNull();
    expect(getBrandLogo('SAMSUNG')).not.toBeNull();
    expect(getBrandLogo('XIAOMI')).not.toBeNull();
    expect(getBrandLogo('MOTOROLA')).not.toBeNull();
  });

  it('should return null for unknown brands', () => {
    expect(getBrandLogo('LG')).toBeNull();
    expect(getBrandLogo('NOKIA')).toBeNull();
  });

  it('should resolve aliases', () => {
    expect(getBrandLogo('IPHONE')).toBe(getBrandLogo('APPLE'));
    expect(getBrandLogo('GALAXY')).toBe(getBrandLogo('SAMSUNG'));
  });
});
