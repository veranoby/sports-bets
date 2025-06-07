"use client";

import React, { useState } from "react";
import { BetCard } from "../../components/user/BetCard";
import { BettingPanel } from "../../components/user/BettingPanel";
import { useBets } from "../../hooks/useBets";
import BetHistoryTable from "../../components/user/BetHistoryTable";
import CreateBetModal from "../../components/user/CreateBetModal";
import { Plus } from "lucide-react";

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
  const { activeBets, betHistory, createBet, cancelBet } = useBets();
  const [activeTab, setActiveTab] = useState<"active" | "history" | "stats">(
    "active"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="bg-[#1a1f37] min-h-screen pb-20">
      {/* Header */}
      <header className="bg-[#2a325c] p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Mis Apuestas</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[#596c95]">
        {["active", "history", "stats"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 font-medium ${
              activeTab === tab
                ? "border-b-2 border-[#cd6263] text-white"
                : "text-gray-400"
            }`}
          >
            {tab === "active" && "Activas"}
            {tab === "history" && "Historial"}
            {tab === "stats" && "Estadísticas"}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {activeTab === "active" && (
          <div className="space-y-3">
            {activeBets.map((bet) => (
              <BetCard
                key={bet.id}
                {...bet}
                onCancel={() => cancelBet(bet.id)}
              />
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <BetHistoryTable />
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-[#2a325c] p-4 rounded-lg">
            <BettingPanel
              onCreateBet={createBet}
              fights={[]} // Pasar peleas disponibles si es necesario
            />
          </div>
        )}
      </div>
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 bg-[#cd6263] text-white p-4 rounded-full shadow-lg"
      >
        <Plus />
      </button>
      {showCreateModal && (
        <CreateBetModal
          fightId="current-fight-id"
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default BetsPage;
