/**
 * WalletSummary Component
 * Muestra un resumen compacto del saldo disponible y congelado del usuario
 * Optimizado para estar en la barra superior de la aplicación
 */
"use client";

import React from "react";
import { Wallet, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../shared/Card";

export interface WalletSummaryProps {
  balance: number;
  frozenAmount: number;
  onViewWallet?: () => void;
  showQuickActions?: boolean;
}

const WalletSummary: React.FC<WalletSummaryProps> = ({
  balance,
  frozenAmount,
  onViewWallet,
  showQuickActions,
}) => {
  const navigate = useNavigate();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  return (
    <div
      className="flex items-center bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 shadow-md border border-red-100 cursor-pointer hover:shadow-lg transition-all"
      onClick={() => navigate("/wallet")}
    >
      <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full mr-4 shadow-sm">
        <Wallet className="w-6 h-6 text-red-500" />
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Tu Billetera
        </h3>
        <div className="flex items-baseline">
          <span className="text-xl font-bold text-gray-900 mr-2">
            {formatCurrency(balance)}
          </span>
          <span className="text-xs text-gray-500">
            / {formatCurrency(frozenAmount)} congelado
          </span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
};

export default WalletSummary;
