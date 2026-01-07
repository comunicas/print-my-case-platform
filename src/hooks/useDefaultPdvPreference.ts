import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "@/hooks/usePreferences";

interface PDV {
  id: string;
  name: string;
}

interface UseDefaultPdvPreferenceOptions {
  pdvs: PDV[];
  isLoading?: boolean;
}

/**
 * Hook para gerenciar seleção de PDV com auto-aplicação de preferência padrão.
 * Centraliza lógica duplicada em Index, Marketing, Uploads, etc.
 */
export function useDefaultPdvPreference({ pdvs, isLoading = false }: UseDefaultPdvPreferenceOptions) {
  const { preferences, isLoading: prefsLoading } = usePreferences();
  const [selectedPdvId, setSelectedPdvId] = useState<string>("all");
  const [wasAutoApplied, setWasAutoApplied] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Auto-aplica PDV da preferência uma vez
  useEffect(() => {
    if (initialized || prefsLoading || isLoading || pdvs.length === 0) return;
    
    if (preferences?.default_pdv) {
      const pdvExists = pdvs.some(p => p.id === preferences.default_pdv);
      if (pdvExists) {
        setSelectedPdvId(preferences.default_pdv);
        setWasAutoApplied(true);
      }
    }
    setInitialized(true);
  }, [preferences, pdvs, prefsLoading, isLoading, initialized]);

  const handlePdvChange = useCallback((value: string) => {
    setSelectedPdvId(value);
    setWasAutoApplied(false);
  }, []);

  return {
    selectedPdvId,
    setSelectedPdvId: handlePdvChange,
    wasAutoApplied,
    isInitialized: initialized,
  };
}
