import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "./usePreferences";

const STORAGE_KEY_COLLAPSED = "sidebar-collapsed";
const STORAGE_KEY_STOCK = "sidebar-reports-expanded"; // Keep same key for backwards compatibility
const STORAGE_KEY_MARKETING = "sidebar-marketing-expanded";

export function useSidebarPreferences() {
  const { preferences, isLoading, updatePreferences } = usePreferences();

  // Initialize from localStorage for immediate response
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

  // Sync with Supabase when preferences load
  useEffect(() => {
    if (preferences) {
      const dbCollapsed = preferences.sidebar_collapsed ?? false;
      const dbStockExpanded = preferences.sidebar_reports_expanded ?? false;
      
      setCollapsed(dbCollapsed);
      setStockExpanded(dbStockExpanded);
      
      // Update localStorage to match database
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(dbCollapsed));
      localStorage.setItem(STORAGE_KEY_STOCK, String(dbStockExpanded));
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
    updatePreferences.mutate({ sidebar_reports_expanded: value });
  }, [updatePreferences]);

  const updateMarketingExpanded = useCallback((value: boolean) => {
    setMarketingExpanded(value);
    localStorage.setItem(STORAGE_KEY_MARKETING, String(value));
    // Marketing expanded is only stored locally for now
  }, []);

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
