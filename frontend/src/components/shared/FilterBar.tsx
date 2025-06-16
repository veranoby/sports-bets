// 🔧 COMPONENTE OPTIMIZADO - Expandir funcionalidad

import React, { useState } from "react";
import { Filter, ChevronDown, X } from "lucide-react";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";
import SearchInput from "./SearchInput";

interface FilterOption {
  key: string;
  label: string;
  type: "select" | "multiselect" | "date" | "range";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (key: string, value: any) => void;
  onClearFilters?: () => void;
  className?: string;
  compact?: boolean;
  showFilterCount?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = "Buscar...",
  onSearch,
  filters = [],
  onFilterChange,
  onClearFilters,
  className = "",
  compact = false,
  showFilterCount = true,
}) => {
  const theme = getUserThemeClasses();
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Contar filtros activos
  const activeFilterCount = Object.values(activeFilters).filter(
    (value) => value && (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  // Handler para cambios de filtro
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };

    // Remover filtros vacíos
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    }

    setActiveFilters(newFilters);
    onFilterChange?.(key, value);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setActiveFilters({});
    onClearFilters?.();
  };

  // Renderizar filtro según tipo
  const renderFilter = (filter: FilterOption) => {
    switch (filter.type) {
      case "select":
        return (
          <select
            value={activeFilters[filter.key] || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className={`${theme.input} min-w-32`}
          >
            <option value="">
              {filter.placeholder || `Seleccionar ${filter.label}`}
            </option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        const selectedValues = activeFilters[filter.key] || [];
        return (
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${theme.input} min-w-32 flex items-center justify-between`}
            >
              <span>
                {selectedValues.length > 0
                  ? `${filter.label} (${selectedValues.length})`
                  : filter.placeholder || filter.label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilters && (
              <div className="absolute z-10 mt-1 w-full bg-[#2a325c] border border-[#596c95] rounded-lg shadow-lg">
                {filter.options?.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-3 py-2 hover:bg-[#596c95] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, option.value]
                          : selectedValues.filter(
                              (v: string) => v !== option.value
                            );
                        handleFilterChange(filter.key, newValues);
                      }}
                      className="mr-2"
                    />
                    <span className="text-white text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra principal */}
      <div
        className={`flex gap-3 ${
          compact ? "flex-col" : "flex-row items-center"
        }`}
      >
        {/* Search Input */}
        {onSearch && (
          <div className="flex-1">
            <SearchInput
              placeholder={searchPlaceholder}
              onSearch={onSearch}
              size={compact ? "sm" : "md"}
              onFilter={
                filters.length > 0
                  ? () => setShowFilters(!showFilters)
                  : undefined
              }
            />
          </div>
        )}

        {/* Botón de filtros */}
        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${theme.primaryButton} flex items-center gap-2 ${
              compact ? "self-start" : ""
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilterCount && activeFilterCount > 0 && (
              <span className="bg-[#cd6263] text-white px-2 py-1 rounded-full text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Panel de filtros */}
      {showFilters && filters.length > 0 && (
        <div className={`${theme.cardBackground} p-4 rounded-lg space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filtros</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar todo
              </button>
            )}
          </div>

          <div
            className={`grid gap-4 ${
              compact ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"
            }`}
          >
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium mb-1">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
