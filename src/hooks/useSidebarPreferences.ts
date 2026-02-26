import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "./usePreferences";

const STORAGE_KEY_COLLAPSED = "sidebar-collapsed";
const STORAGE_KEY_STOCK = "sidebar-stock-expanded";
const STORAGE_KEY_MARKETING = "sidebar-marketing-expanded";

export function useSidebarPreferences() {
  const { preferences, isLoading, updatePreferences } = usePreferences();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLLAPSED);
    return saved === "true";
  });

  const [stockExpanded, setStockExpanded] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STOCK);
    return saved === "true";
  });

  const [marketingExpanded, setMarketingExpanded] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MARKETING);
    return saved === "true";
  });

  // Sync with DB when preferences load — use new dedicated columns
  useEffect(() => {
    if (preferences) {
      const dbCollapsed = preferences.sidebar_collapsed ?? false;
      const dbStock = preferences.sidebar_stock_expanded ?? preferences.sidebar_reports_expanded ?? false;
      const dbMarketing = preferences.sidebar_marketing_expanded ?? false;

      setCollapsed(dbCollapsed);
      setStockExpanded(dbStock);
      setMarketingExpanded(dbMarketing);

      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(dbCollapsed));
      localStorage.setItem(STORAGE_KEY_STOCK, String(dbStock));
      localStorage.setItem(STORAGE_KEY_MARKETING, String(dbMarketing));
    }
  }, [preferences]);

  const updateCollapsed = useCallback((value: boolean) => {
    setCollapsed(value);
    localStorage.setItem(STORAGE_KEY_COLLAPSED, String(value));
    updatePreferences.mutate({ sidebar_collapsed: value });
  }, [updatePreferences]);

  const updateStockExpanded = useCallback((value: boolean) => {
    setStockExpanded(value);
    localStorage.setItem(STORAGE_KEY_STOCK, String(value));
    updatePreferences.mutate({ sidebar_stock_expanded: value });
  }, [updatePreferences]);

  const updateMarketingExpanded = useCallback((value: boolean) => {
    setMarketingExpanded(value);
    localStorage.setItem(STORAGE_KEY_MARKETING, String(value));
    updatePreferences.mutate({ sidebar_marketing_expanded: value });
  }, [updatePreferences]);

  return {
    collapsed,
    stockExpanded,
    marketingExpanded,
    updateCollapsed,
    updateStockExpanded,
    updateMarketingExpanded,
    isLoading,
  };
}
