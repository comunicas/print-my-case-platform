import { describe, it, expect } from 'vitest';
import {
  calculateTotalRevenue,
  calculateKPIs,
  SalesAmountRecord,
  getSalesByDay,
  getSalesByHourAndDay,
  getHeatmapPeak,
  getTopProducts,
  getStockByBrand,
  getQuickStats,
  getLowStockItems,
  getLossesByDay,
  CancellationRecord,
  SaleRecord,
  HeatmapCell,
} from '../dashboardUtils';
import { calculatePercentageChange } from '../trendUtils';

// ===== HELPERS =====

const createSaleRecord = (
  overrides: Partial<SaleRecord> = {}
): SaleRecord => ({
  id: crypto.randomUUID(),
  payment_date: '2024-01-15T10:00:00',
  amount: 100,
  refund_amount: null,
  product_name: 'Produto Teste',
  pdv_id: 'pdv-1',
  ...overrides,
});

// ===== calculateTotalRevenue =====

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
      expect(calculateTotalRevenue(sales)).toBe(230);
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

// ===== calculatePercentageChange =====

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
    it('deve retornar null quando valor anterior é zero (sem base de comparação)', () => {
      // trendUtils retorna null quando previous === 0 (sem dados anteriores)
      expect(calculatePercentageChange(100, 0)).toBeNull();
    });

    it('deve retornar 0 quando valores são iguais', () => {
      expect(calculatePercentageChange(100, 100)).toBe(0);
    });

    it('deve lidar com valores decimais', () => {
      expect(calculatePercentageChange(1.5, 1.0)).toBe(50);
    });
  });
});

// ===== calculateKPIs =====

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
      expect(kpis.revenueChange).toBe(0);
      expect(kpis.transactionsChange).toBe(0);
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
      expect(kpis.revenueChange).toBe(100);
      expect(kpis.transactionsChange).toBe(0);
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
      
      expect(kpis.avgTicket).toBe(200);
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
      
      expect(kpis.transactionsChange).toBe(100);
    });
  });

  describe('integração com reembolsos', () => {
    it('deve considerar reembolsos nos cálculos', () => {
      const currentSales: SalesAmountRecord[] = [
        { amount: 100, refund_amount: 20 },
        { amount: 100, refund_amount: 30 },
      ];
      
      const kpis = calculateKPIs(currentSales, []);
      
      expect(kpis.totalRevenue).toBe(150);
      expect(kpis.transactions).toBe(2);
      expect(kpis.avgTicket).toBe(75);
    });
  });
});

// ===== getSalesByDay =====

describe('getSalesByDay', () => {
  describe('casos básicos', () => {
    it('deve retornar array vazio para vendas vazias', () => {
      expect(getSalesByDay([])).toEqual([]);
    });

    it('deve agrupar vendas do mesmo dia', () => {
      const sales = [
        createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100 }),
        createSaleRecord({ payment_date: '2024-01-15T14:00:00', amount: 200 }),
      ];
      
      const result = getSalesByDay(sales);
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].revenue).toBe(300);
      expect(result[0].count).toBe(2);
    });

    it('deve separar vendas de dias diferentes', () => {
      const sales = [
        createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100 }),
        createSaleRecord({ payment_date: '2024-01-16T10:00:00', amount: 200 }),
      ];
      
      const result = getSalesByDay(sales);
      
      expect(result).toHaveLength(2);
    });
  });

  describe('ordenação', () => {
    it('deve ordenar por data crescente', () => {
      const sales = [
        createSaleRecord({ payment_date: '2024-01-17T10:00:00', amount: 100 }),
        createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 200 }),
        createSaleRecord({ payment_date: '2024-01-16T10:00:00', amount: 150 }),
      ];
      
      const result = getSalesByDay(sales);
      
      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-16');
      expect(result[2].date).toBe('2024-01-17');
    });
  });

  describe('reembolsos', () => {
    it('deve subtrair reembolsos da receita', () => {
      const sales = [
        createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100, refund_amount: 30 }),
      ];
      
      const result = getSalesByDay(sales);
      
      expect(result[0].revenue).toBe(70);
    });
  });

  describe('formatação', () => {
    it('deve formatar dateDisplay contendo dd/MM', () => {
      const sales = [createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100 })];
      
      const result = getSalesByDay(sales);
      
      // O locale pode variar entre ambientes (seg. / segunda / mon.)
      // O que importa é que a data dd/MM esteja presente
      expect(result[0].dateDisplay).toContain('15/01');
    });
  });
});

// ===== getSalesByHourAndDay =====

describe('getSalesByHourAndDay', () => {
  describe('estrutura do heatmap', () => {
    it('deve retornar 56 células (8 faixas x 7 dias) mesmo sem vendas', () => {
      const result = getSalesByHourAndDay([]);
      
      expect(result).toHaveLength(56);
    });

    it('deve inicializar todas as células com revenue 0', () => {
      const result = getSalesByHourAndDay([]);
      
      expect(result.every(cell => cell.revenue === 0)).toBe(true);
      expect(result.every(cell => cell.count === 0)).toBe(true);
    });
  });

  describe('agrupamento por faixa horária', () => {
    it('deve agrupar venda das 10h na faixa 10h-12h', () => {
      // 2024-01-15 é segunda-feira (dayOfWeek = 1)
      const sales = [createSaleRecord({ payment_date: '2024-01-15T10:30:00', amount: 100 })];
      
      const result = getSalesByHourAndDay(sales);
      const cell = result.find(c => c.rangeLabel === '10h-12h' && c.dayOfWeek === 1);
      
      expect(cell?.revenue).toBe(100);
      expect(cell?.count).toBe(1);
    });

    it('deve agrupar venda das 11h na mesma faixa 10h-12h', () => {
      const sales = [createSaleRecord({ payment_date: '2024-01-15T11:45:00', amount: 200 })];
      
      const result = getSalesByHourAndDay(sales);
      const cell = result.find(c => c.rangeLabel === '10h-12h' && c.dayOfWeek === 1);
      
      expect(cell?.revenue).toBe(200);
    });
  });

  describe('dias da semana', () => {
    it('deve identificar domingo como dayOfWeek 0', () => {
      // 2024-01-14 é domingo
      const sales = [createSaleRecord({ payment_date: '2024-01-14T10:00:00', amount: 100 })];
      
      const result = getSalesByHourAndDay(sales);
      const cell = result.find(c => c.rangeLabel === '10h-12h' && c.dayOfWeek === 0);
      
      expect(cell?.dayName).toBe('Dom');
      expect(cell?.revenue).toBe(100);
    });
  });

  describe('acumulação', () => {
    it('deve somar múltiplas vendas na mesma célula', () => {
      const sales = [
        createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100 }),
        createSaleRecord({ payment_date: '2024-01-15T11:00:00', amount: 200 }),
      ];
      
      const result = getSalesByHourAndDay(sales);
      const cell = result.find(c => c.rangeLabel === '10h-12h' && c.dayOfWeek === 1);
      
      expect(cell?.revenue).toBe(300);
      expect(cell?.count).toBe(2);
    });
  });

  describe('horários fora das faixas', () => {
    it('deve ignorar vendas antes das 8h', () => {
      const sales = [createSaleRecord({ payment_date: '2024-01-15T07:00:00', amount: 100 })];
      
      const result = getSalesByHourAndDay(sales);
      
      expect(result.every(cell => cell.revenue === 0)).toBe(true);
    });
  });

  describe('reembolsos', () => {
    it('deve subtrair reembolsos da receita no heatmap', () => {
      const sales = [createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100, refund_amount: 30 })];
      
      const result = getSalesByHourAndDay(sales);
      const cell = result.find(c => c.rangeLabel === '10h-12h' && c.dayOfWeek === 1);
      
      expect(cell?.revenue).toBe(70);
    });
  });
});

// ===== getHeatmapPeak =====

describe('getHeatmapPeak', () => {
  it('deve retornar null para heatmap vazio', () => {
    expect(getHeatmapPeak([])).toBeNull();
  });

  it('deve retornar null quando todos os valores são zero', () => {
    const heatmap: HeatmapCell[] = [
      { rangeId: 0, rangeLabel: '08h-10h', dayOfWeek: 0, dayName: 'Dom', revenue: 0, count: 0 },
      { rangeId: 1, rangeLabel: '10h-12h', dayOfWeek: 1, dayName: 'Seg', revenue: 0, count: 0 },
    ];
    
    expect(getHeatmapPeak(heatmap)).toBeNull();
  });

  it('deve encontrar o pico corretamente', () => {
    const heatmap: HeatmapCell[] = [
      { rangeId: 0, rangeLabel: '08h-10h', dayOfWeek: 0, dayName: 'Dom', revenue: 100, count: 2 },
      { rangeId: 1, rangeLabel: '10h-12h', dayOfWeek: 1, dayName: 'Seg', revenue: 500, count: 5 },
      { rangeId: 2, rangeLabel: '12h-14h', dayOfWeek: 2, dayName: 'Ter', revenue: 200, count: 3 },
    ];
    
    const peak = getHeatmapPeak(heatmap);
    
    expect(peak).toEqual({
      rangeLabel: '10h-12h',
      dayName: 'Seg',
      revenue: 500,
    });
  });

  it('deve retornar primeiro pico em caso de empate', () => {
    const heatmap: HeatmapCell[] = [
      { rangeId: 0, rangeLabel: '08h-10h', dayOfWeek: 0, dayName: 'Dom', revenue: 100, count: 1 },
      { rangeId: 1, rangeLabel: '10h-12h', dayOfWeek: 1, dayName: 'Seg', revenue: 100, count: 1 },
    ];
    
    const peak = getHeatmapPeak(heatmap);
    
    expect(peak?.rangeLabel).toBe('08h-10h');
  });
});

// ===== getTopProducts =====

describe('getTopProducts', () => {
  describe('casos básicos', () => {
    it('deve retornar array vazio para vendas vazias', () => {
      expect(getTopProducts([])).toEqual([]);
    });

    it('deve agrupar por produto', () => {
      const sales = [
        createSaleRecord({ product_name: 'Capinha iPhone', amount: 100 }),
        createSaleRecord({ product_name: 'Capinha iPhone', amount: 150 }),
      ];
      
      const result = getTopProducts(sales);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Capinha iPhone');
      expect(result[0].revenue).toBe(250);
      expect(result[0].count).toBe(2);
    });
  });

  describe('ordenação e limite', () => {
    it('deve ordenar por receita decrescente', () => {
      const sales = [
        createSaleRecord({ product_name: 'Produto A', amount: 100 }),
        createSaleRecord({ product_name: 'Produto B', amount: 300 }),
        createSaleRecord({ product_name: 'Produto C', amount: 200 }),
      ];
      
      const result = getTopProducts(sales);
      
      expect(result[0].name).toBe('Produto B');
      expect(result[1].name).toBe('Produto C');
      expect(result[2].name).toBe('Produto A');
    });

    it('deve respeitar limite padrão de 10', () => {
      const sales = Array.from({ length: 15 }, (_, i) => 
        createSaleRecord({ product_name: `Produto ${i}`, amount: i * 10 })
      );
      
      const result = getTopProducts(sales);
      
      expect(result).toHaveLength(10);
    });

    it('deve respeitar limite customizado', () => {
      const sales = Array.from({ length: 15 }, (_, i) => 
        createSaleRecord({ product_name: `Produto ${i}`, amount: i * 10 })
      );
      
      const result = getTopProducts(sales, 5);
      
      expect(result).toHaveLength(5);
    });
  });

  describe('extração de marca', () => {
    it('deve extrair marca do nome do produto', () => {
      const sales = [createSaleRecord({ product_name: 'Capinha Samsung Galaxy S21', amount: 100 })];
      
      const result = getTopProducts(sales);
      
      expect(result[0].brand).toBe('SAMSUNG');
    });
  });

  describe('reembolsos', () => {
    it('deve subtrair reembolsos da receita', () => {
      const sales = [
        createSaleRecord({ product_name: 'Produto A', amount: 100, refund_amount: 30 }),
      ];
      
      const result = getTopProducts(sales);
      
      expect(result[0].revenue).toBe(70);
    });
  });
});

// ===== getStockByBrand =====

describe('getStockByBrand', () => {
  it('deve retornar array vazio para slots vazios', () => {
    expect(getStockByBrand([])).toEqual([]);
  });

  it('deve agrupar por marca', () => {
    const slots = [
      { brand: 'APPLE', quantity: 10 },
      { brand: 'APPLE', quantity: 5 },
      { brand: 'SAMSUNG', quantity: 8 },
    ];
    
    const result = getStockByBrand(slots);
    
    expect(result).toHaveLength(2);
    expect(result.find(r => r.brand === 'APPLE')?.quantity).toBe(15);
    expect(result.find(r => r.brand === 'SAMSUNG')?.quantity).toBe(8);
  });

  it('deve tratar marca vazia como OUTROS', () => {
    const slots = [
      { brand: '', quantity: 10 },
    ];
    
    const result = getStockByBrand(slots);
    
    expect(result[0].brand).toBe('OUTROS');
  });

  it('deve ordenar por quantidade decrescente', () => {
    const slots = [
      { brand: 'MOTOROLA', quantity: 5 },
      { brand: 'APPLE', quantity: 20 },
      { brand: 'SAMSUNG', quantity: 10 },
    ];
    
    const result = getStockByBrand(slots);
    
    expect(result[0].brand).toBe('APPLE');
    expect(result[1].brand).toBe('SAMSUNG');
    expect(result[2].brand).toBe('MOTOROLA');
  });

  it('deve atribuir cor para cada marca', () => {
    const slots = [{ brand: 'APPLE', quantity: 10 }];
    
    const result = getStockByBrand(slots);
    
    expect(result[0].fill).toBeDefined();
    expect(typeof result[0].fill).toBe('string');
  });
});

// ===== getQuickStats =====

describe('getQuickStats', () => {
  it('deve retornar nulls para vendas vazias', () => {
    const result = getQuickStats([]);
    
    expect(result.peakTimeRange).toBeNull();
    expect(result.peakTimeRangeRevenue).toBeNull();
    expect(result.bestDay).toBeNull();
    expect(result.bestDayRevenue).toBeNull();
  });

  it('deve identificar faixa de pico', () => {
    const sales = [
      createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 500 }), // 10h-12h
      createSaleRecord({ payment_date: '2024-01-15T14:00:00', amount: 100 }), // 14h-16h
    ];
    
    const result = getQuickStats(sales);
    
    expect(result.peakTimeRange).toBe('10h-12h');
    expect(result.peakTimeRangeRevenue).toBe(500);
  });

  it('deve identificar melhor dia', () => {
    const sales = [
      createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100 }), // Segunda
      createSaleRecord({ payment_date: '2024-01-16T10:00:00', amount: 500 }), // Terça
    ];
    
    const result = getQuickStats(sales);
    
    expect(result.bestDay).toBe('Ter');
    expect(result.bestDayRevenue).toBe(500);
  });

  it('deve acumular receita por faixa', () => {
    const sales = [
      createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100 }),
      createSaleRecord({ payment_date: '2024-01-15T11:30:00', amount: 200 }),
    ];
    
    const result = getQuickStats(sales);
    
    expect(result.peakTimeRangeRevenue).toBe(300);
  });

  it('deve acumular receita por dia da semana', () => {
    const sales = [
      createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100 }), // Segunda
      createSaleRecord({ payment_date: '2024-01-22T14:00:00', amount: 200 }), // Segunda seguinte
    ];
    
    const result = getQuickStats(sales);
    
    expect(result.bestDay).toBe('Seg');
    expect(result.bestDayRevenue).toBe(300);
  });

  it('deve subtrair reembolsos', () => {
    const sales = [
      createSaleRecord({ payment_date: '2024-01-15T10:00:00', amount: 100, refund_amount: 30 }),
    ];
    
    const result = getQuickStats(sales);
    
    expect(result.peakTimeRangeRevenue).toBe(70);
  });
});

// ===== getLowStockItems =====

describe('getLowStockItems', () => {
  it('deve retornar array vazio para slots vazios', () => {
    const result = getLowStockItems([], new Map());
    expect(result).toEqual([]);
  });

  it('deve filtrar apenas itens com estoque <= threshold', () => {
    const slots = [
      { slotNumber: 'A1', productName: 'Produto 1', brand: 'APPLE', quantity: 0 },
      { slotNumber: 'A2', productName: 'Produto 2', brand: 'SAMSUNG', quantity: 1 },
      { slotNumber: 'A3', productName: 'Produto 3', brand: 'MOTOROLA', quantity: 5 },
    ];
    
    const result = getLowStockItems(slots, new Map());
    
    expect(result).toHaveLength(2);
    expect(result.map(r => r.slotNumber)).toEqual(['A1', 'A2']);
  });

  it('deve respeitar threshold customizado', () => {
    const slots = [
      { slotNumber: 'A1', productName: 'Produto 1', brand: 'APPLE', quantity: 3 },
    ];
    
    const result = getLowStockItems(slots, new Map(), 5);
    
    expect(result).toHaveLength(1);
  });

  it('deve calcular salesIndex corretamente', () => {
    const slots = [
      { slotNumber: 'A1', productName: 'Produto Alta', brand: 'APPLE', quantity: 0 },
      { slotNumber: 'A2', productName: 'Produto Média', brand: 'SAMSUNG', quantity: 0 },
      { slotNumber: 'A3', productName: 'Produto Baixa', brand: 'MOTOROLA', quantity: 0 },
      { slotNumber: 'A4', productName: 'Produto Zero', brand: 'XIAOMI', quantity: 0 },
    ];
    
    const salesByProduct = new Map([
      ['Produto Alta', 25],    // high >= 20
      ['Produto Média', 10],   // medium >= 5
      ['Produto Baixa', 2],    // low < 5
      ['Produto Zero', 0],     // none = 0
    ]);
    
    const result = getLowStockItems(slots, salesByProduct);
    
    expect(result.find(r => r.productName === 'Produto Alta')?.salesIndex).toBe('high');
    expect(result.find(r => r.productName === 'Produto Média')?.salesIndex).toBe('medium');
    expect(result.find(r => r.productName === 'Produto Baixa')?.salesIndex).toBe('low');
    expect(result.find(r => r.productName === 'Produto Zero')?.salesIndex).toBe('none');
  });

  it('deve ordenar por quantidade crescente', () => {
    const slots = [
      { slotNumber: 'A1', productName: 'Produto 1', brand: 'APPLE', quantity: 1 },
      { slotNumber: 'A2', productName: 'Produto 2', brand: 'SAMSUNG', quantity: 0 },
    ];
    
    const result = getLowStockItems(slots, new Map());
    
    expect(result[0].quantity).toBe(0);
    expect(result[1].quantity).toBe(1);
  });

  it('deve incluir pdvName quando disponível', () => {
    const slots = [
      { slotNumber: 'A1', productName: 'Produto 1', brand: 'APPLE', quantity: 0, pdvName: 'Loja Centro' },
    ];
    
    const result = getLowStockItems(slots, new Map());
    
    expect(result[0].pdvName).toBe('Loja Centro');
  });
});

// ===== getLossesByDay — cancelamentos PT/EN =====

describe('getLossesByDay — cancelamentos em português e inglês', () => {
  describe('cancelamentos em português ("Cancelado")', () => {
    it('deve acumular amount de cancelamentos no dia correto', () => {
      const sales: SaleRecord[] = [];
      const cancellations = [
        { payment_date: '2024-01-15T10:00:00', amount: 250 },
        { payment_date: '2024-01-15T14:00:00', amount: 150 },
      ];

      const result = getLossesByDay(sales, cancellations);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].cancellations).toBe(400);
      expect(result[0].cancellationCount).toBe(2);
    });

    it('deve distinguir cancelamentos de dias diferentes', () => {
      const sales: SaleRecord[] = [];
      const cancellations = [
        { payment_date: '2024-01-15T10:00:00', amount: 100 },
        { payment_date: '2024-01-16T10:00:00', amount: 200 },
        { payment_date: '2024-01-17T10:00:00', amount: 300 },
      ];

      const result = getLossesByDay(sales, cancellations);

      expect(result).toHaveLength(3);
      // Ordenado por data
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].cancellations).toBe(100);
      expect(result[1].date).toBe('2024-01-16');
      expect(result[1].cancellations).toBe(200);
      expect(result[2].date).toBe('2024-01-17');
      expect(result[2].cancellations).toBe(300);
    });

    it('deve calcular total = cancellations + refunds', () => {
      const sales: SaleRecord[] = [
        createSaleRecord({ payment_date: '2024-01-15T10:00:00', refund_amount: 50 }),
      ];
      const cancellations = [
        { payment_date: '2024-01-15T14:00:00', amount: 100 },
      ];

      const result = getLossesByDay(sales, cancellations);

      expect(result).toHaveLength(1);
      expect(result[0].cancellations).toBe(100);
      expect(result[0].refunds).toBe(50);
      expect(result[0].total).toBe(150);
    });
  });

  describe('sem cancelamentos', () => {
    it('deve retornar array vazio quando não há cancelamentos nem reembolsos', () => {
      const sales: SaleRecord[] = [
        createSaleRecord({ refund_amount: null }),
      ];
      const result = getLossesByDay(sales, []);
      expect(result).toHaveLength(0);
    });

    it('deve acumular apenas reembolsos quando não há cancelamentos', () => {
      const sales: SaleRecord[] = [
        createSaleRecord({ payment_date: '2024-01-15T10:00:00', refund_amount: 75 }),
      ];
      const result = getLossesByDay(sales, []);

      expect(result).toHaveLength(1);
      expect(result[0].cancellations).toBe(0);
      expect(result[0].cancellationCount).toBe(0);
      expect(result[0].refunds).toBe(75);
      expect(result[0].refundCount).toBe(1);
    });
  });

  describe('mix de cancelamentos e reembolsos no mesmo período', () => {
    it('deve agrupar cancelamentos EN e PT no mesmo dia com totais corretos', () => {
      const sales: SaleRecord[] = [
        createSaleRecord({ payment_date: '2024-03-10T09:00:00', refund_amount: 30 }),
        createSaleRecord({ payment_date: '2024-03-10T11:00:00', refund_amount: 20 }),
      ];
      const cancellations = [
        { payment_date: '2024-03-10T10:00:00', amount: 500 },  // "Cancelado" (PT)
        { payment_date: '2024-03-10T15:00:00', amount: 300 },  // "Cancelled" (EN)
      ];

      const result = getLossesByDay(sales, cancellations);

      expect(result).toHaveLength(1);
      expect(result[0].cancellations).toBe(800);   // 500 + 300
      expect(result[0].cancellationCount).toBe(2);
      expect(result[0].refunds).toBe(50);           // 30 + 20
      expect(result[0].refundCount).toBe(2);
      expect(result[0].total).toBe(850);            // 800 + 50
    });

    it('deve calcular totalCancellations como soma de amounts dos registros cancelados', () => {
      const cancellations = [
        { payment_date: '2024-01-10T10:00:00', amount: 100 },
        { payment_date: '2024-01-10T11:00:00', amount: 200 },
        { payment_date: '2024-01-11T10:00:00', amount: 400 },
      ];

      const result = getLossesByDay([], cancellations);

      const totalCancellations = result.reduce((sum, d) => sum + d.cancellations, 0);
      expect(totalCancellations).toBe(700); // 100 + 200 + 400
    });
  });

  describe('período anterior zerado', () => {
    it('calculatePercentageChange deve retornar null quando período anterior = 0 (sem base)', () => {
      // trendUtils retorna null quando previous === 0: sem dados anteriores para comparar
      expect(calculatePercentageChange(500, 0)).toBeNull();
    });
  });
});

