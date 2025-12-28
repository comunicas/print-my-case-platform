import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "./usePreferences";

const STORAGE_KEY_COLLAPSED = "sidebar-collapsed";
const STORAGE_KEY_STOCK = "sidebar-reports-expanded"; // Keep same key for backwards compatibility

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

  return {
    collapsed,
    stockExpanded,
    updateCollapsed,
    updateStockExpanded,
    isLoading,
  };
}
