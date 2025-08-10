import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface PropertySelectionContextType {
  selectedProperties: string[];
  setSelectedProperties: (properties: string[]) => void;
  allProperties: string[];
  setAllProperties: (properties: string[]) => void;
  isAllSelected: boolean;
  toggleProperty: (property: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isPropertySelected: (property: string) => boolean;
  // Add internal state for immediate UI updates
  pendingProperties: string[];
  applyPendingChanges: () => void;
  resetPendingChanges: () => void;
  hasPendingChanges: boolean;
}

const PropertySelectionContext = createContext<PropertySelectionContextType | undefined>(undefined);

interface PropertySelectionProviderProps {
  children: ReactNode;
}

export const PropertySelectionProvider: React.FC<PropertySelectionProviderProps> = ({ children }) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [pendingProperties, setPendingProperties] = useState<string[]>([]);
  const [allProperties, setAllProperties] = useState<string[]>([]);

  const isAllSelected = pendingProperties.length === allProperties.length && allProperties.length > 0;
  const hasPendingChanges = JSON.stringify(selectedProperties.sort()) !== JSON.stringify(pendingProperties.sort());

  // Debounced update function
  const applyPendingChanges = useCallback(() => {
    if (hasPendingChanges) {
      console.log('🔄 Applying property selection changes:', pendingProperties);
      setSelectedProperties([...pendingProperties]);
    }
  }, [pendingProperties, hasPendingChanges]);

  // Reset pending to match selected (for cancel operations)
  const resetPendingChanges = useCallback(() => {
    console.log('↩️ Resetting pending changes to:', selectedProperties);
    setPendingProperties([...selectedProperties]);
  }, [selectedProperties]);

  // REMOVED: Auto-apply changes after 500ms - this was causing modal to close/reopen
  // Instead, changes are only applied when user clicks "Apply" button
  
  const toggleProperty = (property: string) => {
    setPendingProperties(prev => {
      if (prev.includes(property)) {
        return prev.filter(p => p !== property);
      } else {
        return [...prev, property];
      }
    });
  };

  const selectAll = () => {
    setPendingProperties([...allProperties]);
  };

  const deselectAll = () => {
    setPendingProperties([]);
  };

  const isPropertySelected = (property: string) => {
    return pendingProperties.includes(property);
  };

  // Auto-select all properties when allProperties is first populated
  useEffect(() => {
    if (allProperties.length > 0 && selectedProperties.length === 0 && pendingProperties.length === 0) {
      const allPropertiesCopy = [...allProperties];
      setSelectedProperties(allPropertiesCopy);
      setPendingProperties(allPropertiesCopy);
    }
  }, [allProperties, selectedProperties.length, pendingProperties.length]);

  // Sync pending with selected when selected changes externally
  useEffect(() => {
    if (!hasPendingChanges && pendingProperties.length === 0 && selectedProperties.length > 0) {
      setPendingProperties([...selectedProperties]);
    }
  }, [selectedProperties, hasPendingChanges, pendingProperties.length]);

  const value = {
    selectedProperties,
    setSelectedProperties,
    allProperties,
    setAllProperties,
    isAllSelected,
    toggleProperty,
    selectAll,
    deselectAll,
    isPropertySelected,
    pendingProperties,
    applyPendingChanges,
    hasPendingChanges,
    resetPendingChanges,
  };

  return (
    <PropertySelectionContext.Provider value={value}>
      {children}
    </PropertySelectionContext.Provider>
  );
};

export const usePropertySelection = () => {
  const context = useContext(PropertySelectionContext);
  if (context === undefined) {
    throw new Error('usePropertySelection must be used within a PropertySelectionProvider');
  }
  return context;
}; 