import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopProductsChart } from '../TopProductsChart';
import type { TopProductData } from '@/lib/dashboardUtils';

const mockOpenProductModal = vi.fn();

vi.mock('@/contexts/ProductModalContext', () => ({
  useProductModal: () => ({
    openProductModal: mockOpenProductModal,
  }),
}));

// Mock recharts ResponsiveContainer para evitar problemas com jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

const mockProducts: TopProductData[] = [
  { name: 'Capinha iPhone 15 Pro Max Clear', brand: 'Apple', revenue: 1500, count: 30 },
  { name: 'Película Samsung Galaxy S24', brand: 'Samsung', revenue: 1200, count: 40 },
  { name: 'Carregador Motorola Turbo', brand: 'Motorola', revenue: 800, count: 20 },
];

describe('TopProductsChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('shows empty message when data is empty', () => {
      render(<TopProductsChart data={[]} />);
      expect(screen.getByTestId('top-products-empty')).toBeInTheDocument();
      expect(screen.getByText('Nenhum dado de produtos disponível')).toBeInTheDocument();
    });

    it('does not show top seller badge when data is empty', () => {
      render(<TopProductsChart data={[]} />);
      expect(screen.queryByTestId('top-seller-badge')).not.toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('renders chart card with correct title', () => {
      render(<TopProductsChart data={mockProducts} />);
      expect(screen.getByTestId('top-products-chart')).toBeInTheDocument();
      expect(screen.getByText('Top 10 Produtos')).toBeInTheDocument();
    });

    it('shows top seller badge with first product name', () => {
      render(<TopProductsChart data={mockProducts} />);
      const badge = screen.getByTestId('top-seller-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Mais vendido:');
    });

    it('renders export button', () => {
      render(<TopProductsChart data={mockProducts} />);
      expect(screen.getByTestId('export-top-products')).toBeInTheDocument();
    });

    it('shows description text', () => {
      render(<TopProductsChart data={mockProducts} />);
      expect(screen.getByText('Produtos com maior receita no período')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls openProductModal when top seller badge is clicked', () => {
      render(<TopProductsChart data={mockProducts} selectedPdvId="pdv-123" />);
      
      const badge = screen.getByTestId('top-seller-badge');
      fireEvent.click(badge.closest('button')!);
      
      expect(mockOpenProductModal).toHaveBeenCalledWith(
        expect.any(String),
        'pdv-123'
      );
    });

    it('passes undefined pdvId when selectedPdvId is not provided', () => {
      render(<TopProductsChart data={mockProducts} />);
      
      const badge = screen.getByTestId('top-seller-badge');
      fireEvent.click(badge.closest('button')!);
      
      expect(mockOpenProductModal).toHaveBeenCalledWith(
        expect.any(String),
        undefined
      );
    });
  });

  describe('truncation', () => {
    it('truncates long product names in badge', () => {
      const longNameProducts: TopProductData[] = [{
        name: 'Capinha Super Ultra Mega iPhone 15 Pro Max Plus Edition',
        brand: 'Apple',
        revenue: 1000,
        count: 10,
      }];
      
      render(<TopProductsChart data={longNameProducts} />);
      
      const badge = screen.getByTestId('top-seller-badge');
      expect(badge.textContent).toContain('...');
    });

    it('does not truncate short product names', () => {
      const shortNameProducts: TopProductData[] = [{
        name: 'Capinha iPhone 15',
        brand: 'Apple',
        revenue: 1000,
        count: 10,
      }];
      
      render(<TopProductsChart data={shortNameProducts} />);
      
      const badge = screen.getByTestId('top-seller-badge');
      expect(badge.textContent).not.toContain('...');
      expect(badge.textContent).toContain('Capinha iPhone 15');
    });
  });
});
