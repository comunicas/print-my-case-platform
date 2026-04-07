import { describe, expect, it } from "vitest";
import { escapePostgrestOrValue, sanitizePostgrestSearchTerm } from "@/hooks/useOrgCrossAccess";

describe("useOrgCrossAccess helpers", () => {
  describe("escapePostgrestOrValue", () => {
    it("escapa vírgula e parênteses", () => {
      expect(escapePostgrestOrValue("john,(doe)"))
        .toBe("john\\,\\(doe\\)");
    });

    it("escapa curingas percent e underscore", () => {
      expect(escapePostgrestOrValue("100%_ok"))
        .toBe("100\\%\\_ok");
    });

    it("escapa aspas duplas", () => {
      expect(escapePostgrestOrValue('jo"hn'))
        .toBe('jo\\"hn');
    });
  });

  describe("sanitizePostgrestSearchTerm", () => {
    it("retorna termo sanitizado para busca válida", () => {
      expect(sanitizePostgrestSearchTerm("  maria,ana  "))
        .toBe("maria\\,ana");
    });

    it("retorna null para termo inválido após sanitização (somente espaços)", () => {
      expect(sanitizePostgrestSearchTerm("   ")).toBeNull();
    });

    it("retorna null para caracteres de controle (fallback seguro)", () => {
      expect(sanitizePostgrestSearchTerm("jo\nhn")).toBeNull();
    });
  });
});
