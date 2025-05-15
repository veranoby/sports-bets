"use client";

import type React from "react";
import { Wallet, ChevronRight } from "lucide-react";

interface WalletSummaryProps {
  balance: number;
  frozenAmount: number;
  onViewWallet: () => void;
}

const WalletSummary: React.FC<WalletSummaryProps> = ({
  balance,
  frozenAmount,
  onViewWallet,
}) => {
  return (
    <div className="flex items-center bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex items-center justify-center w-10 h-10 bg-red-50 rounded-full mr-3">
        <Wallet className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 font-medium">Disponible</span>
          <span className="text-lg font-bold text-gray-900">
            ${balance.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">Congelado</span>
          <span className="text-sm text-gray-500">
            ${frozenAmount.toFixed(2)}
          </span>
        </div>
      </div>
      <button
        onClick={onViewWallet}
        className="ml-2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Ver billetera completa"
      >
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
};

export default WalletSummary;
