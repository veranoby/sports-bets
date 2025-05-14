"use client";

import type React from "react";
import { Wallet, ChevronRight } from "lucide-react";

// Define component props interface
interface WalletSummaryProps {
  balance: number;
  frozenAmount: number;
  onViewWallet: () => void;
}

/**
 * WalletSummary component displays the user's wallet balance in a compact format
 * Includes information about total balance and frozen funds
 */
const WalletSummary: React.FC<WalletSummaryProps> = ({
  balance,
  frozenAmount,
  onViewWallet,
}) => {
  // Format currency values consistently
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  // Calculate available balance
  const availableBalance = balance - frozenAmount;

  return (
    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 border border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
      {/* Wallet icon */}
      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full mr-3">
        <Wallet size={18} className="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Balance information */}
      <div className="flex-1 mr-2">
        <div className="flex items-baseline">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(availableBalance)}
          </span>
          {frozenAmount > 0 && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              ({formatCurrency(frozenAmount)} congelados)
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Saldo disponible
        </p>
      </div>

      {/* Button to view full wallet details */}
      <button
        onClick={onViewWallet}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:focus:ring-amber-700"
        aria-label="Ver billetera"
      >
        <ChevronRight size={18} className="text-gray-400" />
      </button>
    </div>
  );
};

export default WalletSummary;
