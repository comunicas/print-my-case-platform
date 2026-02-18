import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PAGE_SIZE,
  UPLOAD_DETAILS_PAGE_SIZE,
  NOTIFICATIONS_DEFAULT_LIMIT,
  LOW_STOCK_THRESHOLD,
  REDISTRIBUTE_THRESHOLD,
  STOCK_HISTORY_DAYS,
  CHART_ANIMATION_DELAY_STEP,
  ANOMALY_VALUE_THRESHOLD,
  NOTIFICATIONS_POLL_INTERVAL,
  NOTIFICATIONS_STALE_TIME,
  DASHBOARD_SALES_LIMIT,
  PRODUCT_STOCK_SALES_LIMIT,
} from '../constants';
import { MAX_CAPACITY } from '../stockTypes';

describe('Constantes de Paginação', () => {
  it('DEFAULT_PAGE_SIZE deve ser 50', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(50);
  });

  it('UPLOAD_DETAILS_PAGE_SIZE deve ser 10', () => {
    expect(UPLOAD_DETAILS_PAGE_SIZE).toBe(10);
  });

  it('NOTIFICATIONS_DEFAULT_LIMIT deve ser 20', () => {
    expect(NOTIFICATIONS_DEFAULT_LIMIT).toBe(20);
  });
});

describe('Constantes de Estoque', () => {
  it('MAX_CAPACITY deve ser 7', () => {
    expect(MAX_CAPACITY).toBe(7);
  });

  it('LOW_STOCK_THRESHOLD deve ser 2', () => {
    expect(LOW_STOCK_THRESHOLD).toBe(2);
  });

  it('REDISTRIBUTE_THRESHOLD deve ser 5', () => {
    expect(REDISTRIBUTE_THRESHOLD).toBe(5);
  });

  it('LOW_STOCK_THRESHOLD < REDISTRIBUTE_THRESHOLD', () => {
    expect(LOW_STOCK_THRESHOLD).toBeLessThan(REDISTRIBUTE_THRESHOLD);
  });

  it('REDISTRIBUTE_THRESHOLD < MAX_CAPACITY', () => {
    expect(REDISTRIBUTE_THRESHOLD).toBeLessThan(MAX_CAPACITY);
  });
});

describe('Constantes de Dashboard', () => {
  it('STOCK_HISTORY_DAYS deve ser 90', () => {
    expect(STOCK_HISTORY_DAYS).toBe(90);
  });

  it('CHART_ANIMATION_DELAY_STEP deve ser 50ms', () => {
    expect(CHART_ANIMATION_DELAY_STEP).toBe(50);
  });
});

describe('Constantes de Anomalias', () => {
  it('ANOMALY_VALUE_THRESHOLD deve ser R$ 10.000', () => {
    expect(ANOMALY_VALUE_THRESHOLD).toBe(10000);
  });
});

describe('Constantes de Polling/Cache', () => {
  it('NOTIFICATIONS_POLL_INTERVAL deve ser 60 segundos', () => {
    expect(NOTIFICATIONS_POLL_INTERVAL).toBe(60 * 1000);
  });

  it('NOTIFICATIONS_STALE_TIME deve ser 30 segundos', () => {
    expect(NOTIFICATIONS_STALE_TIME).toBe(30 * 1000);
  });

  it('STALE_TIME < POLL_INTERVAL', () => {
    expect(NOTIFICATIONS_STALE_TIME).toBeLessThan(NOTIFICATIONS_POLL_INTERVAL);
  });
});

describe('Query Limits', () => {
  it('DASHBOARD_SALES_LIMIT deve ser 10000', () => {
    expect(DASHBOARD_SALES_LIMIT).toBe(10000);
  });

  it('PRODUCT_STOCK_SALES_LIMIT deve ser 5000', () => {
    expect(PRODUCT_STOCK_SALES_LIMIT).toBe(5000);
  });

  it('DASHBOARD_SALES_LIMIT > PRODUCT_STOCK_SALES_LIMIT', () => {
    expect(DASHBOARD_SALES_LIMIT).toBeGreaterThan(PRODUCT_STOCK_SALES_LIMIT);
  });

  it('Limites estão dentro do razoável para Supabase', () => {
    expect(DASHBOARD_SALES_LIMIT).toBeLessThanOrEqual(50000);
    expect(PRODUCT_STOCK_SALES_LIMIT).toBeLessThanOrEqual(50000);
  });
});
