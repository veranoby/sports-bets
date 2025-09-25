// 🔧 COMPONENTE OPTIMIZADO - Expandir funcionalidad

import React, { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import SearchInput from "./SearchInput";

interface FilterOption {
  key: string;
  label: string;
  type:
    | "select"
    | "multiselect"
    | "date"
    | "range"
    | "number"
    | "text"
    | "daterange";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (
    key: string,
    value: string | string[] | number | Date | [Date, Date] | null,
  ) => void;
  onClearFilters?: () => void;
  className?: string;
  compact?: boolean;
  showFilterCount?: boolean;
  exportable?: boolean;
  exportOptions?: string[];
  onExport?: (format: string) => void;
}

type FilterValue = string | string[] | number | Date | [Date, Date] | null;

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = "Buscar...",
  onSearch,
  filters = [],
  onFilterChange,
  onClearFilters,
  className = "",
  compact = false,
  exportable = false,
  exportOptions,
  onExport,
}) => {
  const theme = {
    input: "input-theme",
    primaryButton: "btn-primary",
    cardBackground: "card-background",
  };
  const [activeFilters, setActiveFilters] = useState<
    Record<string, FilterValue>
  >({});
  const [showFilters, setShowFilters] = useState(false);

  // Contar filtros activos
  const activeFilterCount = Object.values(activeFilters).filter(
    (value) => value && (Array.isArray(value) ? value.length > 0 : true),
  ).length;

  // Handler para cambios de filtro
  const handleFilterChange = (
    key: string,
    value: string | string[] | number | Date | [Date, Date] | null,
  ) => {
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
            value={(activeFilters[filter.key] as string) || ""}
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

      case "multiselect": {
        const selectedValues = (activeFilters[filter.key] as string[]) || [];
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
                              (v: string) => v !== option.value,
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
      }

      case "number":
        return (
          <input
            type="number"
            value={(activeFilters[filter.key] as string) || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className={`${theme.input} min-w-32`}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra principal */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search (izquierda) */}
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

        {/* Filtros (centro) */}
        <div className="flex-1 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-sm font-medium mb-1">
                {filter.label}
              </label>
              {renderFilter(filter)}
            </div>
          ))}
        </div>

        {/* Export/Actions (derecha) */}
        <div className="flex gap-2">
          {exportable && (
            <>
              {exportOptions?.includes("pdf") && (
                <button onClick={() => onExport?.("pdf")}>Exportar PDF</button>
              )}
              {exportOptions?.includes("excel") && (
                <button onClick={() => onExport?.("excel")}>
                  Exportar Excel
                </button>
              )}
            </>
          )}
        </div>
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

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(activeFilters).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm"
                >
                  <span>{`${key}: ${value}`}</span>
                  <button
                    onClick={() => handleFilterChange(key, null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
