import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Estratégia de mock: em vez de criar arquivos XLSX reais (que dependem de
 * codificação UTF-8 no buffer e do ambiente jsdom), mockamos o módulo xlsx
 * para retornar dados de sheet controlados. Isso isola o teste da lógica
 * de parsing de planilhas e foca exclusivamente na lógica de validação de
 * colunas de validateSpreadsheetColumns.
 */
vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

import * as XLSX from "xlsx";
import { validateSpreadsheetColumns } from "../spreadsheet-validator";

// Helper: configura o mock para retornar os headers e rows especificados
function mockSheet(headers: string[], dataRows: (string | number)[][] = []) {
  const allRows = [headers, ...dataRows];
  vi.mocked(XLSX.read).mockReturnValue({
    SheetNames: ["Sheet1"],
    Sheets: { Sheet1: {} },
  } as ReturnType<typeof XLSX.read>);
  vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(allRows as ReturnType<typeof XLSX.utils.sheet_to_json>);
}

// Helper: cria um File fake (arrayBuffer não é chamado porque xlsx.read é mockado)
function fakeFile(): File {
  return { arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) } as unknown as File;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── VENDAS (sales) ─────────────────────────────────────────────────────────

describe("validateSpreadsheetColumns — vendas", () => {
  describe("planilha válida com colunas em PORTUGUÊS", () => {
    it("deve retornar isValid=true para REVENUE.xlsx em português", async () => {
      mockSheet([
        "ID do dispositivo",
        "Número do pedido",
        "Nome do produto",
        "Número da transação",
        "Hora do pagamento",
        "Valor pago",
        "Forma de pagamento",
        "Status",
        "Valor reembolsado",
      ], [["v1"], ["v2"], ["v3"]]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(true);
      expect(result.missingColumns).toHaveLength(0);
      expect(result.totalRows).toBe(3);
    });

    it("deve incluir colunas extras em foundColumns", async () => {
      mockSheet([
        "ID do dispositivo",
        "Número do pedido",
        "Nome do produto",
        "Número da transação",
        "Hora do pagamento",
        "Valor pago",
        "Forma de pagamento",
        "Status",
        "Valor reembolsado",
        "Coluna extra qualquer",
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(true);
      expect(result.foundColumns).toContain("Coluna extra qualquer");
    });
  });

  describe("planilha válida com colunas em INGLÊS (aliases)", () => {
    it("deve aceitar REVENUE-UP.xlsx com colunas em inglês via aliases", async () => {
      mockSheet([
        "Device ID",       // alias: ID do dispositivo
        "Order ID",        // alias: Número do pedido
        "Product Name",    // alias: Nome do produto
        "Payment Flow",    // alias: Número da transação
        "Payment Time",    // alias: Hora do pagamento
        "Payment Amount",  // alias: Valor pago
        "Payment Method",  // alias: Forma de pagamento
        "Status",
        "Refund Amount",   // alias: Valor reembolsado
      ], [["r1"], ["r2"]]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(true);
      expect(result.missingColumns).toHaveLength(0);
      expect(result.totalRows).toBe(2);
    });

    it("deve aceitar alias 'Order Amount' para 'Valor pago'", async () => {
      mockSheet([
        "Device ID",
        "Order ID",
        "Product Name",
        "Transaction ID",
        "Payment Time",
        "Order Amount",    // alias alternativo de Valor pago
        "Payment Method",
        "Status",
        "Refund Amount",
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(true);
    });

    it("deve aceitar alias 'Transaction ID' para 'Número da transação'", async () => {
      mockSheet([
        "Device ID",
        "Order ID",
        "Product Name",
        "Transaction ID",  // alias
        "Payment Time",
        "Payment Amount",
        "Payment Method",
        "Status",
        "Refund Amount",
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(true);
    });
  });

  describe("planilha com colunas faltando", () => {
    it("deve reportar coluna faltando quando ausente", async () => {
      mockSheet([
        // "ID do dispositivo" — FALTANDO
        "Número do pedido",
        "Nome do produto",
        "Número da transação",
        "Hora do pagamento",
        "Valor pago",
        "Forma de pagamento",
        "Status",
        "Valor reembolsado",
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(false);
      expect(result.missingColumns).toContain("ID do dispositivo");
      expect(result.missingColumns).toHaveLength(1);
    });

    it("deve reportar múltiplas colunas faltando", async () => {
      mockSheet(["Nome do produto", "Status"]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(false);
      expect(result.missingColumns.length).toBeGreaterThan(1);
    });

    it("deve reportar todas as colunas faltando para planilha sem headers relevantes", async () => {
      mockSheet(["Coluna Aleatória", "Outra Coluna", "Sem Relação"]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(false);
      expect(result.missingColumns).toHaveLength(9); // todas as SALES_REQUIRED_COLUMNS
    });
  });

  describe("planilha vazia / sem headers", () => {
    it("deve retornar isValid=false e totalRows=0 para planilha vazia", async () => {
      mockSheet([], []);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(false);
      expect(result.totalRows).toBe(0);
      expect(result.foundColumns).toHaveLength(0);
    });
  });

  describe("headers com espaços extras", () => {
    it("deve aceitar headers com espaços extras via trim()", async () => {
      mockSheet([
        "  ID do dispositivo  ", // espaços antes e depois
        " Número do pedido",      // espaço antes
        "Nome do produto ",       // espaço depois
        "Número da transação",
        "Hora do pagamento",
        "Valor pago",
        "Forma de pagamento",
        "Status",
        "Valor reembolsado",
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.isValid).toBe(true);
      expect(result.missingColumns).toHaveLength(0);
    });
  });

  describe("totalRows calculado corretamente", () => {
    it("deve excluir a linha de header do total de linhas", async () => {
      mockSheet([
        "ID do dispositivo",
        "Número do pedido",
        "Nome do produto",
        "Número da transação",
        "Hora do pagamento",
        "Valor pago",
        "Forma de pagamento",
        "Status",
        "Valor reembolsado",
      ], [["v1"], ["v2"], ["v3"], ["v4"], ["v5"]]);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.totalRows).toBe(5);
    });

    it("deve retornar totalRows=0 quando há apenas header sem dados", async () => {
      mockSheet([
        "ID do dispositivo",
        "Número do pedido",
        "Nome do produto",
        "Número da transação",
        "Hora do pagamento",
        "Valor pago",
        "Forma de pagamento",
        "Status",
        "Valor reembolsado",
      ], []);

      const result = await validateSpreadsheetColumns(fakeFile(), "sales");

      expect(result.totalRows).toBe(0);
    });
  });
});

// ─── ESTOQUE (stock) ─────────────────────────────────────────────────────────

describe("validateSpreadsheetColumns — estoque", () => {
  describe("planilha válida com colunas em PORTUGUÊS", () => {
    it("deve retornar isValid=true para REPORT-SLOT.xlsx em português", async () => {
      mockSheet([
        "Número",
        "Código da máquina",
        "Número do compartimento",
        "Nome do produto",
        "Estoque",
        "Ativado",
      ], [["r1"], ["r2"], ["r3"], ["r4"]]);

      const result = await validateSpreadsheetColumns(fakeFile(), "stock");

      expect(result.isValid).toBe(true);
      expect(result.missingColumns).toHaveLength(0);
      expect(result.totalRows).toBe(4);
    });
  });

  describe("planilha válida com colunas em INGLÊS (aliases)", () => {
    it("deve aceitar REPORT-SLOT.xlsx com colunas em inglês via aliases", async () => {
      mockSheet([
        "ID",            // alias: Número
        "Machine Code",  // alias: Código da máquina
        "Slot Number",   // alias: Número do compartimento
        "Product Name",  // alias: Nome do produto
        "Stock",         // alias: Estoque
        "Enabled",       // alias: Ativado
      ], [["r1"]]);

      const result = await validateSpreadsheetColumns(fakeFile(), "stock");

      expect(result.isValid).toBe(true);
      expect(result.missingColumns).toHaveLength(0);
    });
  });

  describe("planilha com colunas faltando", () => {
    it("deve reportar coluna 'Estoque' faltando", async () => {
      mockSheet([
        "Número",
        "Código da máquina",
        "Número do compartimento",
        "Nome do produto",
        // "Estoque" — FALTANDO
        "Ativado",
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "stock");

      expect(result.isValid).toBe(false);
      expect(result.missingColumns).toContain("Estoque");
    });

    it("deve reportar todas as colunas de estoque faltando", async () => {
      mockSheet(["Irrelevante", "Coluna Errada"]);

      const result = await validateSpreadsheetColumns(fakeFile(), "stock");

      expect(result.isValid).toBe(false);
      expect(result.missingColumns).toHaveLength(6); // todas as STOCK_REQUIRED_COLUMNS
    });
  });

  describe("planilha com mix de colunas PT e EN", () => {
    it("deve aceitar mix de colunas portuguesas e inglesas", async () => {
      mockSheet([
        "Número",          // PT
        "Machine Code",    // EN
        "Slot Number",     // EN
        "Nome do produto", // PT
        "Stock",           // EN
        "Ativado",         // PT
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "stock");

      expect(result.isValid).toBe(true);
    });
  });

  describe("headers com espaços extras", () => {
    it("deve aceitar headers de estoque com espaços extras", async () => {
      mockSheet([
        " Número ",
        "Código da máquina",
        " Número do compartimento",
        "Nome do produto ",
        "Estoque",
        "  Ativado  ",
      ]);

      const result = await validateSpreadsheetColumns(fakeFile(), "stock");

      expect(result.isValid).toBe(true);
    });
  });
});

// ─── CASOS EDGE ──────────────────────────────────────────────────────────────

describe("validateSpreadsheetColumns — casos edge", () => {
  it("não deve confundir colunas de estoque ao validar como sales", async () => {
    // Headers válidos para stock, não para sales
    mockSheet([
      "Número",
      "Código da máquina",
      "Número do compartimento",
      "Nome do produto",
      "Estoque",
      "Ativado",
    ]);

    const result = await validateSpreadsheetColumns(fakeFile(), "sales");

    // "Nome do produto" bate, mas o resto não — deve ser inválido para sales
    expect(result.isValid).toBe(false);
    expect(result.missingColumns.length).toBeGreaterThan(0);
  });

  it("não deve validar stock com planilha de vendas", async () => {
    mockSheet([
      "Device ID",
      "Order ID",
      "Product Name",
      "Transaction ID",
      "Payment Time",
      "Payment Amount",
      "Payment Method",
      "Status",
      "Refund Amount",
    ]);

    const result = await validateSpreadsheetColumns(fakeFile(), "stock");

    expect(result.isValid).toBe(false);
    expect(result.missingColumns).toContain("Número");
    expect(result.missingColumns).toContain("Código da máquina");
  });

  it("deve retornar foundColumns sem strings vazias", async () => {
    // sheet_to_json com header:1 já trata células vazias — mas testamos o filtro no validator
    mockSheet(["ID do dispositivo", "", "Nome do produto", ""]);

    const result = await validateSpreadsheetColumns(fakeFile(), "sales");

    // foundColumns deve filtrar strings vazias (o validator faz .filter((h) => h))
    expect(result.foundColumns.every((col) => col.length > 0)).toBe(true);
  });
});
