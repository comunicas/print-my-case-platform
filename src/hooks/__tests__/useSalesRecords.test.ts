import { describe, expect, it } from "vitest";
import { buildSalesRecordsSearchOrFilter } from "@/hooks/useSalesRecords";

describe("useSalesRecords helpers", () => {
  describe("buildSalesRecordsSearchOrFilter", () => {
    it("escapa %, _, vírgula, parênteses e aspas", () => {
      const filter = buildSalesRecordsSearchOrFilter('50%_off, (case) "pro"');

      expect(filter).toBe(
        'product_name.ilike.%50\\%\\_off\\, \\(case\\) \\"pro\\"%,order_number.ilike.%50\\%\\_off\\, \\(case\\) \\"pro\\"%'
      );
    });

    it("retorna null para termo inválido (somente espaços)", () => {
      expect(buildSalesRecordsSearchOrFilter("   ")).toBeNull();
    });
  });
});
