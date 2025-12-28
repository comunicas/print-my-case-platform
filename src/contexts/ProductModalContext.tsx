import { createContext, useContext, useState, ReactNode } from 'react';
import { ProductDetailModal } from '@/components/stock/ProductDetailModal';
import { useSlotsData } from '@/hooks/useSlotsData';

interface ProductModalContextType {
  openProductModal: (productName: string) => void;
  closeProductModal: () => void;
}

const ProductModalContext = createContext<ProductModalContextType | null>(null);

export function ProductModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [productName, setProductName] = useState<string | null>(null);
  const { data: slots = [] } = useSlotsData();

  const openProductModal = (name: string) => {
    setProductName(name);
    setIsOpen(true);
  };

  const closeProductModal = () => {
    setIsOpen(false);
    setProductName(null);
  };

  return (
    <ProductModalContext.Provider value={{ openProductModal, closeProductModal }}>
      {children}
      <ProductDetailModal
        productName={productName}
        slots={slots}
        isOpen={isOpen}
        onClose={closeProductModal}
      />
    </ProductModalContext.Provider>
  );
}

export function useProductModal() {
  const context = useContext(ProductModalContext);
  if (!context) {
    throw new Error('useProductModal must be used within a ProductModalProvider');
  }
  return context;
}
