import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePaginatedQuery';

describe('usePagination', () => {
  // ===== Estado inicial =====

  describe('estado inicial', () => {
    it('deve iniciar na página 1', () => {
      const { result } = renderHook(() => usePagination(50));
      expect(result.current.page).toBe(1);
    });

    it('deve usar o pageSize passado como argumento', () => {
      const { result } = renderHook(() => usePagination(25));
      expect(result.current.pageSize).toBe(25);
    });

    it('deve usar pageSize padrão de 50 quando não informado', () => {
      const { result } = renderHook(() => usePagination());
      expect(result.current.pageSize).toBe(50);
    });

    it('deve iniciar com totalCount = 0', () => {
      const { result } = renderHook(() => usePagination(50));
      expect(result.current.totalCount).toBe(0);
    });

    it('deve iniciar com totalPages = 1 (mínimo garantido)', () => {
      const { result } = renderHook(() => usePagination(50));
      expect(result.current.totalPages).toBe(1);
    });

    it('deve iniciar com hasNextPage = false e hasPrevPage = false', () => {
      const { result } = renderHook(() => usePagination(50));
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
    });
  });

  // ===== setPage =====

  describe('setPage', () => {
    it('deve navegar para uma página específica', () => {
      const { result } = renderHook(() => usePagination(50));

      // Primeiro define totalCount para que setPage(3) seja válido
      act(() => { result.current.setTotalCount(200); });
      act(() => { result.current.setPage(3); });

      expect(result.current.page).toBe(3);
    });

    it('não deve ir abaixo de 1 (limite inferior)', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(200); });
      act(() => { result.current.setPage(0); });

      expect(result.current.page).toBe(1);
    });

    it('não deve ultrapassar totalPages (limite superior)', () => {
      const { result } = renderHook(() => usePagination(50));
      // 100 itens, pageSize=50 → totalPages=2
      act(() => { result.current.setTotalCount(100); });
      act(() => { result.current.setPage(99); });

      expect(result.current.page).toBe(2);
    });

    it('deve respeitar setPage(1) mesmo sem totalCount definido', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setPage(1); });
      expect(result.current.page).toBe(1);
    });
  });

  // ===== setPageSize — foco: reset de página =====

  describe('setPageSize — CRÍTICO: reset de página', () => {
    it('deve resetar para página 1 ao mudar o tamanho da página', () => {
      const { result } = renderHook(() => usePagination(50));

      // Navega para página 3
      act(() => { result.current.setTotalCount(300); });
      act(() => { result.current.setPage(3); });
      expect(result.current.page).toBe(3);

      // Muda o tamanho → deve voltar para página 1
      act(() => { result.current.setPageSize(10); });
      expect(result.current.page).toBe(1);
    });

    it('deve atualizar o pageSize corretamente', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setPageSize(25); });
      expect(result.current.pageSize).toBe(25);
    });
  });

  // ===== getRange =====

  describe('getRange', () => {
    it('deve retornar { from: 0, to: 49 } para página 1 com pageSize 50', () => {
      const { result } = renderHook(() => usePagination(50));
      expect(result.current.getRange()).toEqual({ from: 0, to: 49 });
    });

    it('deve retornar { from: 100, to: 149 } para página 3 com pageSize 50', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(300); });
      act(() => { result.current.setPage(3); });
      expect(result.current.getRange()).toEqual({ from: 100, to: 149 });
    });

    it('deve calcular range correto com pageSize 25 na página 2', () => {
      const { result } = renderHook(() => usePagination(25));
      act(() => { result.current.setTotalCount(100); });
      act(() => { result.current.setPage(2); });
      expect(result.current.getRange()).toEqual({ from: 25, to: 49 });
    });
  });

  // ===== totalPages =====

  describe('totalPages', () => {
    it('deve calcular totalPages corretamente: 105 itens / pageSize=50 → 3 páginas', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(105); });
      expect(result.current.totalPages).toBe(3);
    });

    it('deve calcular totalPages=2 com 100 itens e pageSize=50', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(100); });
      expect(result.current.totalPages).toBe(2);
    });

    it('deve retornar totalPages=1 mesmo com totalCount=0', () => {
      const { result } = renderHook(() => usePagination(50));
      expect(result.current.totalPages).toBe(1);
    });
  });

  // ===== hasNextPage / hasPrevPage =====

  describe('hasNextPage e hasPrevPage', () => {
    it('deve ter hasNextPage=true na página 1 de 3', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(150); });
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('deve ter ambos true na página 2 de 3', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(150); });
      act(() => { result.current.setPage(2); });
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.hasPrevPage).toBe(true);
    });

    it('deve ter hasNextPage=false e hasPrevPage=true na última página', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(150); });
      act(() => { result.current.setPage(3); });
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(true);
    });
  });

  // ===== nextPage / prevPage =====

  describe('nextPage e prevPage', () => {
    it('nextPage deve avançar uma página', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(200); });
      act(() => { result.current.nextPage(); });
      expect(result.current.page).toBe(2);
    });

    it('nextPage não deve avançar além de totalPages', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(100); }); // totalPages=2
      act(() => { result.current.setPage(2); });
      act(() => { result.current.nextPage(); });
      expect(result.current.page).toBe(2);
    });

    it('prevPage deve retroceder uma página', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.setTotalCount(200); });
      act(() => { result.current.setPage(3); });
      act(() => { result.current.prevPage(); });
      expect(result.current.page).toBe(2);
    });

    it('prevPage não deve ir abaixo de 1', () => {
      const { result } = renderHook(() => usePagination(50));
      act(() => { result.current.prevPage(); });
      expect(result.current.page).toBe(1);
    });
  });
});
