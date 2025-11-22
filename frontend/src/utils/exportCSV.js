"use strict";
/**
 * Utility function to export data as CSV file
 * @param data - Array of objects to export
 * @param filename - Name of the CSV file to download
 * @param columns - Array of column configurations mapping data keys to headers
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportToCSV = void 0;
var exportToCSV = function (data, filename, columns) {
    if (!data || data.length === 0) {
        console.warn("No data to export");
        return;
    }
    // Create header row
    var headers = columns.map(function (col) { return "\"".concat(col.header, "\""); }).join(",");
    // Create data rows
    var csvRows = data.map(function (row) {
        return columns
            .map(function (col) {
            var cellValue = row[col.key];
            var value;
            // Properly format values for CSV
            if (cellValue === null || cellValue === undefined) {
                value = "";
            }
            else if (typeof cellValue === "object") {
                value = JSON.stringify(cellValue);
            }
            else if (typeof cellValue === "string") {
                // Escape quotes and wrap in quotes if contains commas, quotes, or newlines
                value = "\"".concat(cellValue.replace(/"/g, '""'), "\"");
            }
            else {
                value = String(cellValue);
            }
            return value;
        })
            .join(",");
    });
    // Combine all rows
    var csvContent = __spreadArray([headers], csvRows, true).join("\n");
    // Create blob and download
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
exports.exportToCSV = exportToCSV;
exports.default = exports.exportToCSV;
