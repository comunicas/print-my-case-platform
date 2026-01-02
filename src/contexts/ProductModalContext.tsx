import { createContext, useContext, useState, ReactNode, lazy, Suspense } from 'react';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useProfile } from '@/hooks/useProfile';

// Lazy load do modal pesado - só carrega quando necessário
const ProductDetailModal = lazy(() => 
  import('@/components/stock/ProductDetailModal').then(m => ({ default: m.ProductDetailModal }))
);

interface ProductModalContextType {
  openProductModal: (productName: string, pdvId?: string) => void;
  closeProductModal: () => void;
}

const ProductModalContext = createContext<ProductModalContextType | null>(null);

export function ProductModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [productName, setProductName] = useState<string | null>(null);
  const [pdvId, setPdvId] = useState<string | undefined>(undefined);
  const { profile } = useProfile();
  const { data: slots = [], isLoading: slotsLoading } = useSlotsData({ userId: profile?.id });

  const openProductModal = (name: string, pdv?: string) => {
    setProductName(name);
    setPdvId(pdv);
    setIsOpen(true);
  };

  const closeProductModal = () => {
    setIsOpen(false);
    setProductName(null);
    setPdvId(undefined);
  };

  return (
    <ProductModalContext.Provider value={{ openProductModal, closeProductModal }}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <ProductDetailModal
            productName={productName}
            slots={slots}
            isOpen={isOpen}
            onClose={closeProductModal}
            pdvId={pdvId}
            slotsLoading={slotsLoading}
          />
        </Suspense>
      )}
    </ProductModalContext.Provider>
  );
}

export function useProductModal() {
  const ctx = useContext(ProductModalContext);
  if (!ctx) {
    return {
      openProductModal: () => {},
      closeProductModal: () => {},
    };
  }
  return ctx;
}
