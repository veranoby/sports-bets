import React from "react";
import { useState } from "react";
import { Pagination } from "./Pagination"; // Import your pagination component
import { LoadingSpinner } from "./LoadingSpinner"; // Import your loading spinner component
import { ArrowDown, ArrowUp, Filter, Download } from "lucide-react"; // Importar íconos de Lucide
import { ActionButton } from "./ActionButton";
import { Modal } from "./Modal";
import { TableLoadingRow } from "./TableLoadingRow";

interface AdvancedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  filters?: FilterConfig[];
  onFiltersChange?: (filters: any) => void;
  actions?: TableAction<T>[];
  exportable?: boolean;
  onExport?: (format: "pdf" | "excel") => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  onSort?: (key: keyof T, direction: "asc" | "desc") => void;
}

interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: (row: T) => boolean;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date";
  options?: { value: string; label: string }[];
}

const AdvancedTable = <T,>({
  data,
  columns,
  loading,
  pagination,
  filters,
  onFiltersChange,
  actions,
  exportable,
  onExport,
  selectable,
  onSelectionChange,
  onSort,
}: AdvancedTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleRowSelect = (row: T) => {
    if (selectable) {
      const newSelectedRows = selectedRows.includes(row)
        ? selectedRows.filter((r) => r !== row)
        : [...selectedRows, row];
      setSelectedRows(newSelectedRows);
      onSelectionChange?.(newSelectedRows);
    }
  };

  const handleSort = (key: keyof T) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  return (
    <div className="overflow-x-auto">
      {exportable && (
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => onExport?.("pdf")}
            className="flex items-center gap-1 p-2 bg-blue-500 text-white rounded"
          >
            <Download size={16} />
            <ActionButton variant="primary">Exportar PDF</ActionButton>
          </button>
          <button
            onClick={() => onExport?.("excel")}
            className="flex items-center gap-1 p-2 bg-green-500 text-white rounded"
          >
            <Download size={16} />
            <ActionButton variant="primary">Exportar Excel</ActionButton>
          </button>
        </div>
      )}
      {filters && (
        <div className="flex gap-2 mb-4 p-2 bg-gray-50 rounded">
          {filters.map((filter) => (
            <div key={filter.key} className="flex items-center gap-1">
              <Filter size={16} className="text-gray-500" />
              <input
                type={filter.type}
                placeholder={filter.label}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="p-1 border rounded"
              />
            </div>
          ))}
        </div>
      )}
      {loading ? (
        <TableLoadingRow
          colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
          text="Cargando datos..."
        />
      ) : data.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No se encontraron datos.
        </div>
      ) : (
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr>
              {selectable && (
                <th className="p-2">
                  <input type="checkbox" />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`p-2 ${column.align}`}
                >
                  {column.label}
                  {column.sortable && <span> 🔼🔽</span>}{" "}
                  {/* Add sorting icons */}
                </th>
              ))}
              {actions && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row[columns[0].key] as string}
                onClick={() => handleRowSelect(row)}
                className="hover:bg-gray-50 border-b border-gray-100 transition-colors"
              >
                {selectable && (
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row)}
                      onChange={() => handleRowSelect(row)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className={`p-2 ${column.align}`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="p-2">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => action.onClick(row)}
                        disabled={
                          action.disabled ? action.disabled(row) : false
                        }
                        className={`btn-${action.variant}`}
                      >
                        {action.icon} {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
      {editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Editar Fila"
        >
          {/* Modal content */}
        </Modal>
      )}
    </div>
  );
};

export default AdvancedTable;
