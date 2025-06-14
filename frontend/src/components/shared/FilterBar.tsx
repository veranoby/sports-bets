import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface FilterOption {
  key: string;
  label: string;
  type: "select" | "date" | "text";
  options?: { value: string; label: string }[];
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = "Buscar...",
  onSearch,
  filters = [],
  onFilterChange,
  onReset,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newValues = { ...filterValues, [key]: value };
    setFilterValues(newValues);
    onFilterChange?.(key, value);
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilterValues({});
    onReset?.();
  };

  return (
    <div className={`flex flex-col md:flex-row gap-3 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#596c95] focus:border-[#596c95] outline-none"
        />
      </div>

      {filters.map((filter) => (
        <div key={filter.key} className="flex-1">
          {filter.type === "select" ? (
            <select
              value={filterValues[filter.key] || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#596c95] focus:border-[#596c95] outline-none"
            >
              <option value="">{filter.label}</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : filter.type === "date" ? (
            <input
              type="date"
              value={filterValues[filter.key] || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#596c95] focus:border-[#596c95] outline-none"
            />
          ) : (
            <input
              type="text"
              placeholder={filter.label}
              value={filterValues[filter.key] || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#596c95] focus:border-[#596c95] outline-none"
            />
          )}
        </div>
      ))}

      {(searchTerm || Object.values(filterValues).some(Boolean)) && (
        <button
          onClick={handleReset}
          className="flex items-center justify-center px-4 py-2 bg-[#cd6263] text-white rounded-lg hover:bg-[#b55556] transition-colors"
        >
          <X className="w-4 h-4 mr-1" />
          Limpiar
        </button>
      )}
    </div>
  );
};

export default FilterBar;
