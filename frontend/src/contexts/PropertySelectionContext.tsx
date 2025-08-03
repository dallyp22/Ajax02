import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

const PropertySelectionContext = createContext<PropertySelectionContextType | undefined>(undefined);

interface PropertySelectionProviderProps {
  children: ReactNode;
}

export const PropertySelectionProvider: React.FC<PropertySelectionProviderProps> = ({ children }) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [allProperties, setAllProperties] = useState<string[]>([]);

  const isAllSelected = selectedProperties.length === allProperties.length && allProperties.length > 0;

  const toggleProperty = (property: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(property)) {
        return prev.filter(p => p !== property);
      } else {
        return [...prev, property];
      }
    });
  };

  const selectAll = () => {
    setSelectedProperties([...allProperties]);
  };

  const deselectAll = () => {
    setSelectedProperties([]);
  };

  const isPropertySelected = (property: string) => {
    return selectedProperties.includes(property);
  };

  // Auto-select all properties when allProperties is first populated
  useEffect(() => {
    if (allProperties.length > 0 && selectedProperties.length === 0) {
      setSelectedProperties([...allProperties]);
    }
  }, [allProperties]);

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