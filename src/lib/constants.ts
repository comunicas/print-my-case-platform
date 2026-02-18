/**
 * Constantes centralizadas da aplicação
 * Evita magic numbers espalhados pelo código
 */

// ===== Paginação =====
export const DEFAULT_PAGE_SIZE = 50;
export const UPLOAD_DETAILS_PAGE_SIZE = 10;
export const NOTIFICATIONS_DEFAULT_LIMIT = 20;

// ===== Dashboard =====
/** Janela de histórico de estoque em dias */
export const STOCK_HISTORY_DAYS = 90;

// ===== Anomalias =====
export const ANOMALY_VALUE_THRESHOLD = 10000; // R$ acima deste valor é considerado anomalia

// ===== Polling =====
export const NOTIFICATIONS_POLL_INTERVAL = 60 * 1000; // 1 minuto
export const NOTIFICATIONS_STALE_TIME = 30 * 1000; // 30 segundos

// ===== Query Limits =====
export const DASHBOARD_SALES_LIMIT = 10000; // Limite para queries de vendas no dashboard
export const PRODUCT_STOCK_SALES_LIMIT = 5000; // Limite para queries de vendas no estoque

// ===== Domínio =====
export const CUSTOM_DOMAIN = "https://printmycase.comunicas.com.br";
