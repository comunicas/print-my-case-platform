import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StockAlertsTable } from '../StockAlertsTable';
import type { LowStockItem } from '@/lib/dashboardUtils';

const mockOpenProductModal = vi.fn();

vi.mock('@/contexts/ProductModalContext', () => ({
  useProductModal: () => ({
    openProductModal: mockOpenProductModal,
  }),
}));

const mockLowStockItems: LowStockItem[] = [
  {
    slotNumber: 'A01',
    productName: 'Capinha iPhone 15',
    brand: 'Apple',
    quantity: 0,
    pdvName: 'PDV Centro',
    salesCount: 25,
    salesIndex: 'high',
  },
  {
    slotNumber: 'B02',
    productName: 'Película Samsung',
    brand: 'Samsung',
    quantity: 2,
    pdvName: 'PDV Shopping',
    salesCount: 10,
    salesIndex: 'medium',
  },
  {
    slotNumber: 'C03',
    productName: 'Carregador Motorola',
    brand: 'Motorola',
    quantity: 1,
    pdvName: 'PDV Centro',
    salesCount: 3,
    salesIndex: 'low',
  },
];

describe('StockAlertsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('shows stock OK message when data is empty', () => {
      render(<StockAlertsTable data={[]} />);
      expect(screen.getByTestId('stock-alerts-ok')).toBeInTheDocument();
      expect(screen.getByText('Estoque OK')).toBeInTheDocument();
    });

    it('shows subtitle message for empty state', () => {
      render(<StockAlertsTable data={[]} />);
      expect(screen.getByText('Nenhum produto com estoque crítico')).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('renders table with alerts', () => {
      render(<StockAlertsTable data={mockLowStockItems} />);
      expect(screen.getByTestId('stock-alerts-table')).toBeInTheDocument();
    });

    it('shows correct alert count in header', () => {
      render(<StockAlertsTable data={mockLowStockItems} />);
      expect(screen.getByText(`Alertas de Estoque (${mockLowStockItems.length})`)).toBeInTheDocument();
    });

    it('renders all alert rows', () => {
      render(<StockAlertsTable data={mockLowStockItems} />);
      const rows = screen.getAllByTestId('stock-alert-row');
      expect(rows).toHaveLength(mockLowStockItems.length);
    });

    it('displays slot numbers correctly', () => {
      render(<StockAlertsTable data={mockLowStockItems} />);
      expect(screen.getByText('A01')).toBeInTheDocument();
      expect(screen.getByText('B02')).toBeInTheDocument();
      expect(screen.getByText('C03')).toBeInTheDocument();
    });

    it('displays product names correctly', () => {
      render(<StockAlertsTable data={mockLowStockItems} />);
      expect(screen.getByText('Capinha iPhone 15')).toBeInTheDocument();
      expect(screen.getByText('Película Samsung')).toBeInTheDocument();
      expect(screen.getByText('Carregador Motorola')).toBeInTheDocument();
    });
  });

  describe('status badges', () => {
    it('shows "Ruptura" badge for items with quantity 0', () => {
      const zeroStockItem: LowStockItem[] = [{ ...mockLowStockItems[0], quantity: 0 }];
      render(<StockAlertsTable data={zeroStockItem} />);
      expect(screen.getByText('Ruptura')).toBeInTheDocument();
    });

    it('shows "Atenção" badge for items with quantity > 0', () => {
      const lowStockItem: LowStockItem[] = [{ ...mockLowStockItems[0], quantity: 2 }];
      render(<StockAlertsTable data={lowStockItem} />);
      expect(screen.getByText('Atenção')).toBeInTheDocument();
    });

    it('shows both badges when mixed quantities', () => {
      render(<StockAlertsTable data={mockLowStockItems} />);
      expect(screen.getByText('Ruptura')).toBeInTheDocument();
      expect(screen.getAllByText('Atenção')).toHaveLength(2);
    });
  });

  describe('pagination', () => {
    it('hides pagination when items <= 5', () => {
      render(<StockAlertsTable data={mockLowStockItems.slice(0, 3)} />);
      expect(screen.queryByTestId('alerts-prev-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('alerts-next-page')).not.toBeInTheDocument();
    });

    it('shows pagination when items > 5', () => {
      const manyItems: LowStockItem[] = Array(8).fill(null).map((_, i) => ({
        ...mockLowStockItems[0],
        slotNumber: `A0${i}`,
        productName: `Produto ${i}`,
      }));
      render(<StockAlertsTable data={manyItems} />);
      expect(screen.getByTestId('alerts-prev-page')).toBeInTheDocument();
      expect(screen.getByTestId('alerts-next-page')).toBeInTheDocument();
    });

    it('shows correct page indicator', () => {
      const manyItems: LowStockItem[] = Array(8).fill(null).map((_, i) => ({
        ...mockLowStockItems[0],
        slotNumber: `A0${i}`,
        productName: `Produto ${i}`,
      }));
      render(<StockAlertsTable data={manyItems} />);
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    });

    it('navigates to next page when clicking next', () => {
      const manyItems: LowStockItem[] = Array(8).fill(null).map((_, i) => ({
        ...mockLowStockItems[0],
        slotNumber: `A0${i}`,
        productName: `Produto ${i}`,
      }));
      render(<StockAlertsTable data={manyItems} />);
      
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('alerts-next-page'));
      
      expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    });

    it('navigates back to previous page', () => {
      const manyItems: LowStockItem[] = Array(8).fill(null).map((_, i) => ({
        ...mockLowStockItems[0],
        slotNumber: `A0${i}`,
        productName: `Produto ${i}`,
      }));
      render(<StockAlertsTable data={manyItems} />);
      
      fireEvent.click(screen.getByTestId('alerts-next-page'));
      expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('alerts-prev-page'));
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    });

    it('disables prev button on first page', () => {
      const manyItems: LowStockItem[] = Array(8).fill(null).map((_, i) => ({
        ...mockLowStockItems[0],
        slotNumber: `A0${i}`,
        productName: `Produto ${i}`,
      }));
      render(<StockAlertsTable data={manyItems} />);
      
      expect(screen.getByTestId('alerts-prev-page')).toBeDisabled();
    });

    it('disables next button on last page', () => {
      const manyItems: LowStockItem[] = Array(8).fill(null).map((_, i) => ({
        ...mockLowStockItems[0],
        slotNumber: `A0${i}`,
        productName: `Produto ${i}`,
      }));
      render(<StockAlertsTable data={manyItems} />);
      
      fireEvent.click(screen.getByTestId('alerts-next-page'));
      
      expect(screen.getByTestId('alerts-next-page')).toBeDisabled();
    });
  });

  describe('product click', () => {
    it('calls openProductModal with correct params when product is clicked', () => {
      render(<StockAlertsTable data={mockLowStockItems} selectedPdvId="pdv-123" />);
      
      const productButton = screen.getByText(mockLowStockItems[0].productName);
      fireEvent.click(productButton);
      
      expect(mockOpenProductModal).toHaveBeenCalledWith(
        expect.any(String),
        'pdv-123'
      );
    });

    it('passes undefined pdvId when selectedPdvId is not provided', () => {
      render(<StockAlertsTable data={mockLowStockItems} />);
      
      const productButton = screen.getByText(mockLowStockItems[0].productName);
      fireEvent.click(productButton);
      
      expect(mockOpenProductModal).toHaveBeenCalledWith(
        expect.any(String),
        undefined
      );
    });
  });
});
