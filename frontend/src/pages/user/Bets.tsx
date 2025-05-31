"use client";

import React, { useState } from "react";
import BetCard from "../../components/user/BetCard";
import BettingPanel from "../../components/user/BettingPanel";
import { useBets } from "../../hooks/useBets";

// Componente Tabs personalizado con Tailwind
const Tabs = ({
  value,
  onValueChange,
  children,
  className = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

const TabsList = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex border-b border-gray-200 ${className}`}>{children}</div>
);

const TabsTrigger = ({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    className={`px-4 py-2 font-medium text-sm focus:outline-none ${className}`}
  >
    {children}
  </button>
);

const TabsContent = ({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => <div className={`mt-2 ${className}`}>{children}</div>;

const BetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("active");
  const { activeBets, availableBets, betHistory, loading, error } = useBets();

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            Mis Apuestas
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="active"
              className={`rounded-md py-2 text-center text-sm font-medium transition-colors ${
                activeTab === "active"
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Activas
            </TabsTrigger>
            <TabsTrigger
              value="available"
              className={`rounded-md py-2 text-center text-sm font-medium transition-colors ${
                activeTab === "available"
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Disponibles
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className={`rounded-md py-2 text-center text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Apuestas Activas */}
          <TabsContent value="active" className="mt-4">
            <div className="space-y-4">
              {activeBets.length > 0 ? (
                activeBets.map((bet) => <BetCard key={bet.id} {...bet} />)
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No tienes apuestas activas
                </p>
              )}
            </div>
          </TabsContent>

          {/* Pestaña de Apuestas Disponibles */}
          <TabsContent value="available">
            <BettingPanel bets={availableBets} />
          </TabsContent>

          {/* Pestaña de Historial */}
          <TabsContent value="history">
            <div className="space-y-4">
              {betHistory.length > 0 ? (
                betHistory.map((bet) => <BetCard key={bet.id} {...bet} />)
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No hay historial de apuestas
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BetsPage;
