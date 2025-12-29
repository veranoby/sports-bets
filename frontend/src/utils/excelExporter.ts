// frontend/src/utils/excelExporter.ts
// Utility functions to export data to Excel format
// Uses xlsx library to generate .xlsx files with proper formatting

import { utils, writeFile } from "xlsx";
import type { User } from "../types";
import type { WalletOperation } from "../types/walletOperation";
import type { UnifiedBet } from "../types/unified";

/**
 * Export wallet operations to Excel file with proper formatting and filters
 * @param operations - Array of wallet operations to export
 * @param filename - Name for the output Excel file
 */
export const exportWalletOperationsToExcel = (
  operations: Array<
    WalletOperation & {
      user?: Pick<User, "username" | "id"> | null;
      processedAt?: string | null;
      completedAt?: string | null;
    }
  >,
  filename: string = "wallet-operations.xlsx",
) => {
  // Prepare data with proper column headers
  const worksheetData = operations.map((operation) => ({
    ID: operation.id,
    Usuario: operation.user?.username || operation.userId,
    Tipo: operation.type,
    Monto: operation.amount,
    Estado: operation.status,
    "Prueba Pago": operation.paymentProofUrl || "",
    "Prueba Admin": operation.adminProofUrl || "",
    "Notas Admin": operation.adminNotes || "",
    "Motivo Rechazo": operation.rejectionReason || "",
    Creado: new Date(operation.createdAt).toLocaleString("es-ES"),
    Procesado: operation.processedAt
      ? new Date(operation.processedAt).toLocaleString("es-ES")
      : "",
    Completado: operation.completedAt
      ? new Date(operation.completedAt).toLocaleString("es-ES")
      : "",
    "Usuario Procesado": operation.processedBy || "",
  }));

  // Create worksheet
  const worksheet = utils.json_to_sheet(worksheetData);

  // Add some basic formatting
  worksheet["!cols"] = [
    { wch: 30 }, // ID column
    { wch: 15 }, // Usuario column
    { wch: 12 }, // Tipo column
    { wch: 12 }, // Monto column
    { wch: 12 }, // Estado column
    { wch: 30 }, // Prueba Pago column
    { wch: 30 }, // Prueba Admin column
    { wch: 30 }, // Notas Admin column
    { wch: 30 }, // Motivo Rechazo column
    { wch: 20 }, // Creado column
    { wch: 20 }, // Procesado column
    { wch: 20 }, // Completado column
    { wch: 15 }, // Usuario Procesado column
  ];

  // Create workbook
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Operaciones Wallet");

  // Generate and download file
  const safeFilename = sanitizeFilename(filename);
  writeFile(workbook, safeFilename);
};

/**
 * Export bets to Excel with proper formatting
 * @param bets - Array of bets to export
 * @param filename - Name for the output Excel file
 */
export const exportBetsToExcel = (
  bets: UnifiedBet[],
  filename: string = "bets.xlsx",
) => {
  const worksheetData = bets.map((bet) => ({
    ID: bet.id,
    Usuario: bet.user?.username || bet.userId,
    Pelear: bet.fight?.number || bet.fightId,
    Lado: bet.side,
    Monto: bet.amount,
    Tipo: bet.betType || "flat",
    Estado: bet.status,
    Resultado: bet.result || "",
    "Potencial Ganar": bet.potentialWin || "",
    "Emparejado Con": bet.matchedWith || "",
    "Padre Apuesta": bet.parentBetId || "",
    Términos: JSON.stringify(bet.terms || {}),
    Creado: new Date(bet.createdAt).toLocaleString("es-ES"),
    Actualizado: new Date(bet.updatedAt).toLocaleString("es-ES"),
  }));

  const worksheet = utils.json_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { wch: 20 }, // ID
    { wch: 15 }, // Usuario
    { wch: 10 }, // Pelear
    { wch: 8 }, // Lado
    { wch: 10 }, // Monto
    { wch: 10 }, // Tipo
    { wch: 12 }, // Estado
    { wch: 10 }, // Resultado
    { wch: 15 }, // Potencial Ganar
    { wch: 20 }, // Emparejado Con
    { wch: 20 }, // Padre Apuesta
    { wch: 20 }, // Términos
    { wch: 20 }, // Creado
    { wch: 20 }, // Actualizado
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Apuestas");

  const safeFilename = sanitizeFilename(filename);
  writeFile(workbook, safeFilename);
};

/**
 * Export users to Excel with proper formatting
 * @param users - Array of users to export
 * @param filename - Name for the output Excel file
 */
export const exportUsersToExcel = (
  users: Array<
    User & {
      lastLoginAt?: string;
      currentSubscription?: {
        type?: string;
        expiresAt?: string;
      };
    }
  >,
  filename: string = "users.xlsx",
) => {
  const worksheetData = users.map((user) => ({
    ID: user.id,
    Username: user.username,
    Email: user.email,
    Rol: user.role,
    Activo: user.isActive ? "Sí" : "No",
    "Billetera Balance": user.wallet?.balance || 0,
    Creado: new Date(user.createdAt).toLocaleString("es-ES"),
    "Último Login": user.lastLoginAt
      ? new Date(user.lastLoginAt).toLocaleString("es-ES")
      : "",
    "Tipo Subscripción": user.currentSubscription?.type || "N/A",
    "Expira Subscripción": user.currentSubscription?.expiresAt
      ? new Date(user.currentSubscription.expiresAt).toLocaleString("es-ES")
      : "",
  }));

  const worksheet = utils.json_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { wch: 30 }, // ID
    { wch: 15 }, // Username
    { wch: 25 }, // Email
    { wch: 10 }, // Rol
    { wch: 8 }, // Activo
    { wch: 15 }, // Billetera Balance
    { wch: 20 }, // Creado
    { wch: 20 }, // Último Login
    { wch: 15 }, // Tipo Subscripción
    { wch: 20 }, // Expira Subscripción
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Usuarios");

  const safeFilename = sanitizeFilename(filename);
  writeFile(workbook, safeFilename);
};

/**
 * Sanitize filename to remove potentially problematic characters
 */
const sanitizeFilename = (filename: string): string => {
  // Remove or replace characters that are problematic in filenames
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, "_");

  // Ensure proper extension
  if (!sanitized.toLowerCase().endsWith(".xlsx")) {
    sanitized += ".xlsx";
  }

  return sanitized;
};

// Export all functions as default
export default {
  exportWalletOperationsToExcel,
  exportBetsToExcel,
  exportUsersToExcel,
};
