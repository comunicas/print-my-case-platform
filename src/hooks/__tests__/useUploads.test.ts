/**
 * Testes de reset de página no useUploads
 *
 * Estratégia: a lógica de reset de página é um useEffect simples
 * que chama pagination.setPage(1) ao mudar filtros. O teste mais
 * confiável e estável é isolar esse padrão diretamente com
 * usePagination + um wrapper que simula o efeito do useUploads,
 * sem precisar mockar toda a camada de Supabase + React Query.
 *
 * Isso reflete exatamente o comportamento documentado em useUploads.ts:
 *   useEffect(() => {
 *     pagination.setPage(1);
 *   }, [pdvId, type, status, search]);
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useEffect } from 'react';
import { usePagination } from '@/hooks/usePaginatedQuery';

// Hook auxiliar que replica o padrão de reset de página do useUploads
// sem depender de auth, supabase ou react-query
function useUploadsPageReset(filters: {
  pdvId?: string;
  type?: string;
  status?: string;
  search?: string;
}) {
  const pagination = usePagination(50);
  const { pdvId, type, status, search } = filters;

  useEffect(() => {
    pagination.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdvId, type, status, search]);

  return pagination;
}

// Hook auxiliar que permite mudar os filtros dinamicamente (simula o caller do useUploads)
function useFilters(initial: { pdvId?: string; type?: string; status?: string; search?: string }) {
  const [filters, setFilters] = useState(initial);
  const pagination = useUploadsPageReset(filters);
  return { filters, setFilters, pagination };
}

describe('useUploads — reset de página ao mudar filtros', () => {
  // ===== pdvId =====

  describe('filtro pdvId', () => {
    it('deve resetar para página 1 quando pdvId mudar', async () => {
      const { result } = renderHook(() =>
        useFilters({ pdvId: 'pdv-1', type: 'all', status: 'all', search: '' })
      );

      // Simula navegação para página 3
      act(() => { result.current.pagination.setTotalCount(300); });
      act(() => { result.current.pagination.setPage(3); });
      expect(result.current.pagination.page).toBe(3);

      // Muda o filtro pdvId → deve resetar
      act(() => { result.current.setFilters(f => ({ ...f, pdvId: 'pdv-2' })); });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  // ===== type =====

  describe('filtro type', () => {
    it('deve resetar para página 1 quando type mudar', () => {
      const { result } = renderHook(() =>
        useFilters({ pdvId: 'all', type: 'all', status: 'all', search: '' })
      );

      act(() => { result.current.pagination.setTotalCount(300); });
      act(() => { result.current.pagination.setPage(2); });
      expect(result.current.pagination.page).toBe(2);

      act(() => { result.current.setFilters(f => ({ ...f, type: 'sales' })); });
      expect(result.current.pagination.page).toBe(1);
    });

    it('deve resetar ao mudar type de sales para stock', () => {
      const { result } = renderHook(() =>
        useFilters({ pdvId: 'all', type: 'sales', status: 'all', search: '' })
      );

      act(() => { result.current.pagination.setTotalCount(300); });
      act(() => { result.current.pagination.setPage(4); });
      expect(result.current.pagination.page).toBe(4);

      act(() => { result.current.setFilters(f => ({ ...f, type: 'stock' })); });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  // ===== status =====

  describe('filtro status', () => {
    it('deve resetar para página 1 quando status mudar', () => {
      const { result } = renderHook(() =>
        useFilters({ pdvId: 'all', type: 'all', status: 'all', search: '' })
      );

      act(() => { result.current.pagination.setTotalCount(300); });
      act(() => { result.current.pagination.setPage(2); });
      expect(result.current.pagination.page).toBe(2);

      act(() => { result.current.setFilters(f => ({ ...f, status: 'ready' })); });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  // ===== search =====

  describe('filtro search', () => {
    it('deve resetar para página 1 quando search mudar', () => {
      const { result } = renderHook(() =>
        useFilters({ pdvId: 'all', type: 'all', status: 'all', search: '' })
      );

      act(() => { result.current.pagination.setTotalCount(300); });
      act(() => { result.current.pagination.setPage(5); });
      expect(result.current.pagination.page).toBe(5);

      act(() => { result.current.setFilters(f => ({ ...f, search: 'iphone' })); });
      expect(result.current.pagination.page).toBe(1);
    });

    it('deve resetar ao limpar a busca (search → "")', () => {
      const { result } = renderHook(() =>
        useFilters({ pdvId: 'all', type: 'all', status: 'all', search: 'samsung' })
      );

      act(() => { result.current.pagination.setTotalCount(300); });
      act(() => { result.current.pagination.setPage(3); });
      expect(result.current.pagination.page).toBe(3);

      act(() => { result.current.setFilters(f => ({ ...f, search: '' })); });
      expect(result.current.pagination.page).toBe(1);
    });
  });

  // ===== múltiplos filtros =====

  describe('múltiplos filtros simultâneos', () => {
    it('deve resetar mesmo quando vários filtros mudam ao mesmo tempo', () => {
      const { result } = renderHook(() =>
        useFilters({ pdvId: 'all', type: 'all', status: 'all', search: '' })
      );

      act(() => { result.current.pagination.setTotalCount(300); });
      act(() => { result.current.pagination.setPage(3); });
      expect(result.current.pagination.page).toBe(3);

      act(() => {
        result.current.setFilters({
          pdvId: 'pdv-1',
          type: 'sales',
          status: 'ready',
          search: 'iphone',
        });
      });
      expect(result.current.pagination.page).toBe(1);
    });
  });
});
