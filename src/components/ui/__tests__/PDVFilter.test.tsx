import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PDVFilter } from '../PDVFilter';

// Mock usePreferences hook
const mockMutate = vi.fn();
const mockPreferences = {
  preferences: { default_pdv: null } as { default_pdv: string | null },
  updatePreferences: {
    mutate: mockMutate,
    isPending: false,
  },
};

vi.mock('@/hooks/usePreferences', () => ({
  usePreferences: () => mockPreferences,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const mockPdvs = [
  { id: 'pdv-1', name: 'PDV Centro' },
  { id: 'pdv-2', name: 'PDV Shopping' },
];

describe('PDVFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreferences.preferences = { default_pdv: null };
    mockPreferences.updatePreferences.isPending = false;
  });

  describe('rendering', () => {
    it('renders select with "Todos os PDVs" option', () => {
      render(
        <Wrapper>
          <PDVFilter value="all" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      expect(screen.getByText('Todos os PDVs')).toBeInTheDocument();
    });

    it('renders all PDV options when opened', async () => {
      render(
        <Wrapper>
          <PDVFilter value="all" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      fireEvent.click(screen.getByRole('combobox'));
      
      await waitFor(() => {
        expect(screen.getByText('PDV Centro')).toBeInTheDocument();
        expect(screen.getByText('PDV Shopping')).toBeInTheDocument();
      });
    });
  });

  describe('Auto badge', () => {
    it('shows Auto badge when showAutoAppliedBadge is true', () => {
      render(
        <Wrapper>
          <PDVFilter 
            value="pdv-1" 
            onChange={vi.fn()} 
            pdvs={mockPdvs} 
            showAutoAppliedBadge={true}
          />
        </Wrapper>
      );
      
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('hides Auto badge when showAutoAppliedBadge is false', () => {
      render(
        <Wrapper>
          <PDVFilter 
            value="pdv-1" 
            onChange={vi.fn()} 
            pdvs={mockPdvs} 
            showAutoAppliedBadge={false}
          />
        </Wrapper>
      );
      
      expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    });
  });

  describe('save as default', () => {
    it('shows save button when PDV is selected and not default', () => {
      mockPreferences.preferences = { default_pdv: null };
      
      render(
        <Wrapper>
          <PDVFilter value="pdv-1" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      expect(screen.getByTestId('save-default-pdv')).toBeInTheDocument();
    });

    it('hides save button when value is "all"', () => {
      render(
        <Wrapper>
          <PDVFilter value="all" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      expect(screen.queryByTestId('save-default-pdv')).not.toBeInTheDocument();
      expect(screen.queryByTestId('clear-default-pdv')).not.toBeInTheDocument();
    });

    it('calls updatePreferences.mutate when save button clicked', async () => {
      mockPreferences.preferences = { default_pdv: null };
      
      render(
        <Wrapper>
          <PDVFilter value="pdv-1" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      fireEvent.click(screen.getByTestId('save-default-pdv'));
      
      expect(mockMutate).toHaveBeenCalledWith({ default_pdv: 'pdv-1' });
    });
  });

  describe('clear default', () => {
    it('shows clear button when selected PDV is current default', () => {
      mockPreferences.preferences = { default_pdv: 'pdv-1' };
      
      render(
        <Wrapper>
          <PDVFilter value="pdv-1" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      expect(screen.getByTestId('clear-default-pdv')).toBeInTheDocument();
    });

    it('calls updatePreferences.mutate with null when clear button clicked', async () => {
      mockPreferences.preferences = { default_pdv: 'pdv-1' };
      
      render(
        <Wrapper>
          <PDVFilter value="pdv-1" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      fireEvent.click(screen.getByTestId('clear-default-pdv'));
      
      expect(mockMutate).toHaveBeenCalledWith({ default_pdv: null });
    });
  });

  describe('loading states', () => {
    it('disables buttons when isPending is true', () => {
      mockPreferences.preferences = { default_pdv: null };
      mockPreferences.updatePreferences.isPending = true;
      
      render(
        <Wrapper>
          <PDVFilter value="pdv-1" onChange={vi.fn()} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      expect(screen.getByTestId('save-default-pdv')).toBeDisabled();
    });
  });

  describe('onChange callback', () => {
    it('calls onChange when a different PDV is selected', async () => {
      const handleChange = vi.fn();
      
      render(
        <Wrapper>
          <PDVFilter value="all" onChange={handleChange} pdvs={mockPdvs} />
        </Wrapper>
      );
      
      fireEvent.click(screen.getByRole('combobox'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('PDV Centro'));
      });
      
      expect(handleChange).toHaveBeenCalledWith('pdv-1');
    });
  });
});
