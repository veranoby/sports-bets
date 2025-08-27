import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface TableLoadingRowProps {
  colSpan: number;
  text?: string;
  className?: string;
}

const TableLoadingRow: React.FC<TableLoadingRowProps> = ({
  colSpan,
  text = "Cargando datos...",
  className = "",
}) => (
  <tr className={`bg-gray-50 ${className}`}>
    <td colSpan={colSpan} className="py-4 text-center">
      <div className="flex items-center justify-center space-x-2">
        <LoadingSpinner size="sm" />
        <span className="text-gray-600">{text}</span>
      </div>
    </td>
  </tr>
);

export default TableLoadingRow;
