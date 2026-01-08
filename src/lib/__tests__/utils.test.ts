import { describe, it, expect } from 'vitest';
import { pluralize, formatCurrency, formatNumber, getInitials } from '../utils';

describe('pluralize', () => {
  describe('casos básicos', () => {
    it('deve retornar singular para count = 1', () => {
      expect(pluralize(1, 'venda', 'vendas')).toBe('1 venda');
    });

    it('deve retornar plural para count > 1', () => {
      expect(pluralize(5, 'unidade', 'unidades')).toBe('5 unidades');
    });

    it('deve retornar plural para count = 0', () => {
      expect(pluralize(0, 'item', 'itens')).toBe('0 itens');
    });
  });

  describe('casos edge', () => {
    it('deve lidar com números negativos (plural)', () => {
      expect(pluralize(-1, 'venda', 'vendas')).toBe('-1 vendas');
    });

    it('deve lidar com números decimais (plural)', () => {
      expect(pluralize(1.5, 'hora', 'horas')).toBe('1.5 horas');
    });

    it('deve lidar com valores grandes', () => {
      expect(pluralize(1000000, 'produto', 'produtos')).toBe('1000000 produtos');
    });
  });

  describe('diferentes palavras', () => {
    it('cancelamento/cancelamentos', () => {
      expect(pluralize(1, 'cancelamento', 'cancelamentos')).toBe('1 cancelamento');
      expect(pluralize(3, 'cancelamento', 'cancelamentos')).toBe('3 cancelamentos');
    });

    it('reembolso/reembolsos', () => {
      expect(pluralize(1, 'reembolso', 'reembolsos')).toBe('1 reembolso');
      expect(pluralize(0, 'reembolso', 'reembolsos')).toBe('0 reembolsos');
    });
  });
});

describe('formatCurrency', () => {
  it('deve formatar valor em reais brasileiro', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
  });

  it('deve formatar valor com centavos', () => {
    expect(formatCurrency(99.99)).toBe('R$ 99,99');
  });

  it('deve formatar zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});

describe('formatNumber', () => {
  it('deve formatar número com separador de milhar', () => {
    expect(formatNumber(1000)).toBe('1.000');
  });

  it('deve formatar número grande', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });
});

describe('getInitials', () => {
  it('deve extrair iniciais de nome completo', () => {
    expect(getInitials('João Silva')).toBe('JS');
  });

  it('deve extrair iniciais de nome simples', () => {
    expect(getInitials('Maria')).toBe('M');
  });

  it('deve limitar a 2 caracteres', () => {
    expect(getInitials('Ana Beatriz Costa')).toBe('AB');
  });
});
