/**
 * Utility function to export data as CSV file
 * @param data - Array of objects to export
 * @param filename - Name of the CSV file to download
 * @param columns - Array of column configurations mapping data keys to headers
 */

export interface CSVColumn<T> {
  key: keyof T;
  header: string;
}

export const exportToCSV = <T,>(
  data: T[],
  filename: string,
  columns: CSVColumn<T>[]
): void => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Create header row
  const headers = columns.map(col => `"${col.header}"`).join(",");

  // Create data rows
  const csvRows = data.map(row => {
    return columns.map(col => {
      const cellValue = row[col.key];
      let value;

      // Properly format values for CSV
      if (cellValue === null || cellValue === undefined) {
        value = '';
      } else if (typeof cellValue === 'object') {
        value = JSON.stringify(cellValue);
      } else if (typeof cellValue === 'string') {
        // Escape quotes and wrap in quotes if contains commas, quotes, or newlines
        value = `"${cellValue.replace(/"/g, '""')}"`;
      } else {
        value = String(cellValue);
      }

      return value;
    }).join(",");
  });

  // Combine all rows
  const csvContent = [headers, ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportToCSV;