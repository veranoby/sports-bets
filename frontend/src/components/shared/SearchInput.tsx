// 🔍 COMPONENTE OPTIMIZADO - Versión unificada y mejorada

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (term: string) => void;
  className?: string;
  value?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "bordered";
  // Nuevas funcionalidades
  suggestions?: string[];
  showClearButton?: boolean;
  debounceMs?: number;
  loading?: boolean;
  onFilter?: () => void;
  maxLength?: number;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Buscar...",
  onSearch,
  className = "",
  value: controlledValue,
  disabled = false,
  size = "md",
  variant = "default",
  suggestions = [],
  showClearButton = true,
  debounceMs = 300,
  loading = false,
  onFilter,
  maxLength = 100,
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const isControlled = controlledValue !== undefined;
  const searchValue = isControlled ? controlledValue : internalValue;

  // Clases de tamaño
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 text-sm";
      case "lg":
        return "h-12 text-lg";
      default:
        return "h-10 text-base";
    }
  };

  // Clases de variante
  const getVariantClasses = () => {
    switch (variant) {
      case "filled":
        return "border-0";
      case "bordered":
        return "bg-transparent border-2 border-[#596c95]";
      default:
        return "input-theme";
    }
  };

  // Filtrar sugerencias
  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(searchValue.toLowerCase()) &&
        suggestion.toLowerCase() !== searchValue.toLowerCase()
    )
    .slice(0, 5);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(searchValue);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, onSearch, debounceMs]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, maxLength);

    if (isControlled) {
      onSearch(newValue); // En modo controlado, notificar inmediatamente
    } else {
      setInternalValue(newValue);
    }

    setSelectedSuggestion(-1);
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0);
  };

  const handleClear = () => {
    const newValue = "";

    if (isControlled) {
      onSearch(newValue);
    } else {
      setInternalValue(newValue);
    }

    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isControlled) {
      onSearch(suggestion);
    } else {
      setInternalValue(suggestion);
    }

    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestion((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestion((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestion >= 0) {
          handleSuggestionClick(filteredSuggestions[selectedSuggestion]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (searchValue.length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Icono de búsqueda */}
        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
            size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"
          }`}
        />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            w-full pl-10 pr-12 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-[#596c95] focus:border-transparent
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${getSizeClasses()}
            ${getVariantClasses()}
          `}
        />

        {/* Botones de acción */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Loading indicator */}
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#596c95]"></div>
          )}

          {/* Clear button */}
          {showClearButton && searchValue.length > 0 && !loading && (
            <button
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          {/* Filter button */}
          {onFilter && (
            <button
              onClick={onFilter}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              type="button"
            >
              <Filter className="w-4 h-4 text-gray-400 hover:text-[#596c95]" />
            </button>
          )}
        </div>
      </div>

      {/* Sugerencias */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#2a325c] border border-[#596c95] rounded-lg shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full text-left px-4 py-2 hover:bg-[#596c95] transition-colors
                ${index === selectedSuggestion ? "bg-[#596c95]" : ""}
                ${index === 0 ? "rounded-t-lg" : ""}
                ${
                  index === filteredSuggestions.length - 1 ? "rounded-b-lg" : ""
                }
              `}
            >
              <span className="text-white">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
