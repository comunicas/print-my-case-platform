import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { cn, pluralize, formatCurrency, formatNumber, getInitials, parseZodErrors } from '../utils';

describe('cn', () => {
  it('deve combinar classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deve lidar com classes condicionais', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deve fazer merge de classes Tailwind conflitantes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('deve retornar string vazia para inputs vazios', () => {
    expect(cn()).toBe('');
  });

  it('deve lidar com undefined e null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('deve fazer merge de variantes Tailwind', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('parseZodErrors', () => {
  const testSchema = z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome muito curto'),
  });

  it('deve retornar null para resultado válido', () => {
    const result = testSchema.safeParse({ email: 'test@test.com', name: 'João' });
    expect(parseZodErrors(result)).toBeNull();
  });

  it('deve extrair erros de validação', () => {
    const result = testSchema.safeParse({ email: 'invalido', name: 'J' });
    const errors = parseZodErrors(result);
    expect(errors?.email).toBe('Email inválido');
    expect(errors?.name).toBe('Nome muito curto');
  });

  it('deve lidar com campo único inválido', () => {
    const result = testSchema.safeParse({ email: 'test@test.com', name: 'J' });
    const errors = parseZodErrors(result);
    expect(errors?.name).toBe('Nome muito curto');
    expect(errors?.email).toBeUndefined();
  });

  it('deve lidar com objeto vazio', () => {
    const result = testSchema.safeParse({});
    const errors = parseZodErrors(result);
    expect(errors).not.toBeNull();
  });
});

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

// Normaliza espaços Unicode (narrow no-break space \u202F) que o Intl usa em pt-BR
// para espaço normal, garantindo testes cross-platform
const normalizeCurrency = (s: string) => s.replace(/\u202F/g, ' ').replace(/\u00A0/g, ' ');

describe('formatCurrency', () => {
  it('deve formatar valor em reais brasileiro', () => {
    expect(normalizeCurrency(formatCurrency(1000))).toBe('R$ 1.000,00');
  });

  it('deve formatar valor com centavos', () => {
    expect(normalizeCurrency(formatCurrency(99.99))).toBe('R$ 99,99');
  });

  it('deve formatar zero', () => {
    expect(normalizeCurrency(formatCurrency(0))).toBe('R$ 0,00');
  });

  it('deve formatar valores negativos', () => {
    expect(normalizeCurrency(formatCurrency(-100))).toBe('-R$ 100,00');
  });

  it('deve formatar valores muito grandes', () => {
    expect(normalizeCurrency(formatCurrency(1000000))).toBe('R$ 1.000.000,00');
  });

  it('deve arredondar valores com muitas casas decimais', () => {
    expect(normalizeCurrency(formatCurrency(99.999))).toBe('R$ 100,00');
  });

  it('deve formatar valores pequenos', () => {
    expect(normalizeCurrency(formatCurrency(0.01))).toBe('R$ 0,01');
  });
});

describe('formatNumber', () => {
  it('deve formatar número com separador de milhar', () => {
    expect(formatNumber(1000)).toBe('1.000');
  });

  it('deve formatar número grande', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('deve formatar zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('deve formatar valores negativos', () => {
    expect(formatNumber(-1000)).toBe('-1.000');
  });

  it('deve formatar valores decimais', () => {
    expect(formatNumber(1234.56)).toBe('1.234,56');
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

  it('deve retornar string vazia para input vazio', () => {
    expect(getInitials('')).toBe('');
  });

  it('deve manter apenas letras em maiúsculo', () => {
    expect(getInitials('josé maria')).toBe('JM');
  });

  it('deve lidar com nome com múltiplos espaços', () => {
    expect(getInitials('João   Silva')).toBe('JS');
  });
});
