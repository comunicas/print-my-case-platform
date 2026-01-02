import { describe, it, expect } from 'vitest';
import {
  calculateTotalRevenue,
  calculatePercentageChange,
  calculateKPIs,
  SalesAmountRecord,
} from '../dashboardUtils';

describe('calculateTotalRevenue', () => {
  describe('casos básicos', () => {
    it('deve retornar 0 para array vazio', () => {
      expect(calculateTotalRevenue([])).toBe(0);
    });

    it('deve calcular receita sem reembolsos', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 100 },
        { amount: 200 },
        { amount: 150 },
      ];
      expect(calculateTotalRevenue(sales)).toBe(450);
    });

    it('deve subtrair reembolsos parciais', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 100, refund_amount: 20 },
        { amount: 200, refund_amount: 50 },
      ];
      expect(calculateTotalRevenue(sales)).toBe(230); // (100-20) + (200-50)
    });

    it('deve lidar com reembolso total', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 100, refund_amount: 100 },
      ];
      expect(calculateTotalRevenue(sales)).toBe(0);
    });
  });

  describe('conversão de tipos', () => {
    it('deve converter amount string para número', () => {
      const sales: SalesAmountRecord[] = [
        { amount: '100.50' },
        { amount: '200.25' },
      ];
      expect(calculateTotalRevenue(sales)).toBe(300.75);
    });

    it('deve converter refund_amount string para número', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 100, refund_amount: '30' },
      ];
      expect(calculateTotalRevenue(sales)).toBe(70);
    });

    it('deve tratar refund_amount null como 0', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 100, refund_amount: null },
      ];
      expect(calculateTotalRevenue(sales)).toBe(100);
    });

    it('deve tratar refund_amount undefined como 0', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 100, refund_amount: undefined },
      ];
      expect(calculateTotalRevenue(sales)).toBe(100);
    });
  });

  describe('precisão decimal', () => {
    it('deve manter precisão em valores decimais', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 99.99, refund_amount: 0.01 },
      ];
      expect(calculateTotalRevenue(sales)).toBeCloseTo(99.98, 2);
    });
  });
});

describe('calculatePercentageChange', () => {
  describe('crescimento', () => {
    it('deve calcular 100% de crescimento (dobrou)', () => {
      expect(calculatePercentageChange(200, 100)).toBe(100);
    });

    it('deve calcular 50% de crescimento', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
    });

    it('deve calcular 10% de crescimento', () => {
      expect(calculatePercentageChange(110, 100)).toBe(10);
    });
  });

  describe('queda', () => {
    it('deve calcular -50% de queda', () => {
      expect(calculatePercentageChange(50, 100)).toBe(-50);
    });

    it('deve calcular -100% quando zerou', () => {
      expect(calculatePercentageChange(0, 100)).toBe(-100);
    });

    it('deve calcular -25% de queda', () => {
      expect(calculatePercentageChange(75, 100)).toBe(-25);
    });
  });

  describe('casos especiais', () => {
    it('deve retornar 0 quando valor anterior é zero', () => {
      expect(calculatePercentageChange(100, 0)).toBe(0);
    });

    it('deve retornar 0 quando valores são iguais', () => {
      expect(calculatePercentageChange(100, 100)).toBe(0);
    });

    it('deve lidar com valores decimais', () => {
      expect(calculatePercentageChange(1.5, 1.0)).toBe(50);
    });
  });
});

describe('calculateKPIs', () => {
  describe('casos básicos', () => {
    it('deve retornar zeros para arrays vazios', () => {
      const kpis = calculateKPIs([], []);
      
      expect(kpis.totalRevenue).toBe(0);
      expect(kpis.transactions).toBe(0);
      expect(kpis.avgTicket).toBe(0);
      expect(kpis.revenueChange).toBe(0);
      expect(kpis.transactionsChange).toBe(0);
    });

    it('deve calcular KPIs com vendas atuais apenas', () => {
      const currentSales: SalesAmountRecord[] = [
        { amount: 100 },
        { amount: 200 },
      ];
      
      const kpis = calculateKPIs(currentSales, []);
      
      expect(kpis.totalRevenue).toBe(300);
      expect(kpis.transactions).toBe(2);
      expect(kpis.avgTicket).toBe(150);
      expect(kpis.revenueChange).toBe(0); // anterior = 0
      expect(kpis.transactionsChange).toBe(0); // anterior = 0
    });

    it('deve calcular variações com ambos períodos', () => {
      const currentSales: SalesAmountRecord[] = [
        { amount: 200 },
        { amount: 200 },
      ];
      const previousSales: SalesAmountRecord[] = [
        { amount: 100 },
        { amount: 100 },
      ];
      
      const kpis = calculateKPIs(currentSales, previousSales);
      
      expect(kpis.totalRevenue).toBe(400);
      expect(kpis.transactions).toBe(2);
      expect(kpis.avgTicket).toBe(200);
      expect(kpis.revenueChange).toBe(100); // dobrou
      expect(kpis.transactionsChange).toBe(0); // mesmo número
    });
  });

  describe('cálculo de avgTicket', () => {
    it('deve calcular ticket médio corretamente', () => {
      const sales: SalesAmountRecord[] = [
        { amount: 100 },
        { amount: 200 },
        { amount: 300 },
      ];
      
      const kpis = calculateKPIs(sales, []);
      
      expect(kpis.avgTicket).toBe(200); // 600 / 3
    });

    it('deve retornar 0 quando não há transações', () => {
      const kpis = calculateKPIs([], []);
      expect(kpis.avgTicket).toBe(0);
    });
  });

  describe('variações percentuais', () => {
    it('deve calcular queda de receita', () => {
      const currentSales: SalesAmountRecord[] = [
        { amount: 100 },
      ];
      const previousSales: SalesAmountRecord[] = [
        { amount: 200 },
      ];
      
      const kpis = calculateKPIs(currentSales, previousSales);
      
      expect(kpis.revenueChange).toBe(-50);
    });

    it('deve calcular aumento de transações', () => {
      const currentSales: SalesAmountRecord[] = [
        { amount: 50 },
        { amount: 50 },
        { amount: 50 },
        { amount: 50 },
      ];
      const previousSales: SalesAmountRecord[] = [
        { amount: 100 },
        { amount: 100 },
      ];
      
      const kpis = calculateKPIs(currentSales, previousSales);
      
      expect(kpis.transactionsChange).toBe(100); // 2 -> 4 = 100%
    });
  });

  describe('integração com reembolsos', () => {
    it('deve considerar reembolsos nos cálculos', () => {
      const currentSales: SalesAmountRecord[] = [
        { amount: 100, refund_amount: 20 },
        { amount: 100, refund_amount: 30 },
      ];
      
      const kpis = calculateKPIs(currentSales, []);
      
      expect(kpis.totalRevenue).toBe(150); // (100-20) + (100-30)
      expect(kpis.transactions).toBe(2);
      expect(kpis.avgTicket).toBe(75);
    });
  });
});
