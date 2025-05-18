/**
 * WalletSummary Component
 * Muestra un resumen compacto del saldo disponible y congelado del usuario
 * Optimizado para estar en la barra superior de la aplicación
 */
"use client";

import React from "react";
import { Wallet, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface WalletSummaryProps {
  balance: number;
  frozenAmount: number;
  // onViewWallet: () => void;
}

const WalletSummary: React.FC<WalletSummaryProps> = ({
  balance,
  frozenAmount,
  // onViewWallet,
}) => {
  const navigate = useNavigate();
  // Formatear valores monetarios para consistencia
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="flex items-center bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex items-center justify-center w-10 h-10 bg-red-50 rounded-full mr-3 flex-shrink-0">
        <Wallet className="w-5 h-5 text-red-500" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 font-medium">Disponible</span>
          <span className="text-lg font-bold text-gray-900 ml-2 truncate">
            {formatCurrency(balance)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">Congelado</span>
          <span className="text-sm text-gray-500 ml-2 truncate">
            {formatCurrency(frozenAmount)}
          </span>
        </div>
      </div>
      <button
        onClick={() => navigate("/wallet")}
        className="ml-2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 !border-0"
        aria-label="Ver billetera completa"
        style={{ backgroundColor: "transparent" }}
      >
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
};

export default WalletSummary;
