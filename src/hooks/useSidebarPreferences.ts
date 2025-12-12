import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "./usePreferences";

const STORAGE_KEY_COLLAPSED = "sidebar-collapsed";
const STORAGE_KEY_REPORTS = "sidebar-reports-expanded";

export function useSidebarPreferences() {
  const { preferences, isLoading, updatePreferences } = usePreferences();

  // Initialize from localStorage for immediate response
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLLAPSED);
    return saved === "true";
  });

  const [reportsExpanded, setReportsExpanded] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REPORTS);
    return saved === "true";
  });

  // Sync with Supabase when preferences load
  useEffect(() => {
    if (preferences) {
      const dbCollapsed = preferences.sidebar_collapsed ?? false;
      const dbReportsExpanded = preferences.sidebar_reports_expanded ?? false;
      
      setCollapsed(dbCollapsed);
      setReportsExpanded(dbReportsExpanded);
      
      // Update localStorage to match database
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(dbCollapsed));
      localStorage.setItem(STORAGE_KEY_REPORTS, String(dbReportsExpanded));
    }
  }, [preferences]);

  const updateCollapsed = useCallback((value: boolean) => {
    setCollapsed(value);
    localStorage.setItem(STORAGE_KEY_COLLAPSED, String(value));
    updatePreferences.mutate({ sidebar_collapsed: value });
  }, [updatePreferences]);

  const updateReportsExpanded = useCallback((value: boolean) => {
    setReportsExpanded(value);
    localStorage.setItem(STORAGE_KEY_REPORTS, String(value));
    updatePreferences.mutate({ sidebar_reports_expanded: value });
  }, [updatePreferences]);

  return {
    collapsed,
    reportsExpanded,
    updateCollapsed,
    updateReportsExpanded,
    isLoading,
  };
}
