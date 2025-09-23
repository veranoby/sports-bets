import React from "react";

interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
}

interface FilterConfig {
  key: string;
  type: string;
  label: string;
}

interface TableAction<T> {
  label: string;
  onClick: (record: T) => void;
}

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

function AdvancedTable<T>({
  data,
  columns,
  loading = false,
}: AdvancedTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] || "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay datos disponibles
        </div>
      )}
    </div>
  );
}

export default AdvancedTable;
