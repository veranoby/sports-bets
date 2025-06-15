// frontend/src/components/shared/DatePicker.tsx
// 📅 COMPONENTE FALTANTE - Selector de fechas avanzado

import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserThemeClasses } from "../../contexts/UserThemeContext";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  format?: "short" | "long";
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className = "",
  format = "short",
}) => {
  const theme = getUserThemeClasses();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const formatDate = (date: Date) => {
    if (format === "long") {
      return date.toLocaleDateString("es", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return date.toLocaleDateString("es");
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Días del mes anterior (para completar la primera semana)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Días del mes siguiente (para completar la última semana)
    const remainingCells = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!value) return false;
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectDate = (date: Date) => {
    if (!isDateDisabled(date)) {
      onChange(date);
      setIsOpen(false);
    }
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className={`relative ${className}`}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`${theme.input} w-full flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className={value ? "text-white" : "text-gray-400"}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar panel */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-[#2a325c] border border-[#596c95] rounded-lg shadow-xl p-4 w-80">
            {/* Header con navegación */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-1 rounded hover:bg-[#596c95] text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h3 className="font-semibold text-white">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h3>

              <button
                onClick={() => navigateMonth("next")}
                className="p-1 rounded hover:bg-[#596c95] text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendario */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map(
                ({ date, isCurrentMonth }, index) => {
                  const disabled = isDateDisabled(date);
                  const today = isToday(date);
                  const selected = isSelected(date);

                  return (
                    <button
                      key={index}
                      onClick={() => selectDate(date)}
                      disabled={disabled}
                      className={`
                      w-8 h-8 text-sm rounded transition-colors
                      ${
                        !isCurrentMonth
                          ? "text-gray-600 hover:text-gray-400"
                          : "text-gray-300 hover:text-white"
                      }
                      ${
                        disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                      ${
                        today && !selected
                          ? "bg-[#596c95]/30 text-[#596c95] font-bold"
                          : ""
                      }
                      ${
                        selected
                          ? "bg-[#cd6263] text-white font-bold"
                          : "hover:bg-[#596c95]/20"
                      }
                    `}
                    >
                      {date.getDate()}
                    </button>
                  );
                }
              )}
            </div>

            {/* Footer con acciones rápidas */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-[#596c95]">
              <button
                onClick={() => selectDate(new Date())}
                className="flex-1 py-2 px-3 bg-[#596c95] hover:bg-[#4a5b80] text-white text-sm rounded transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DatePicker;
