import React, { useState, useMemo } from "react";
import type { Bet } from "../../types";
import { useBets } from "../../hooks/useApi";
import AdvancedTable from "../shared/AdvancedTable";
import StatusChip from "../shared/StatusChip";
import LoadingSpinner from "../shared/LoadingSpinner";

interface BetHistoryTableProps {
  bets: Bet[];
  onBetClick?: (bet: Bet) => void;
}

const BetHistoryTable = ({ bets, onBetClick }: BetHistoryTableProps) => {
  const { loading } = useBets();
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Define columns for AdvancedTable
  const columns = useMemo(
    () => [
      {
        key: "eventName" as keyof Bet,
        title: "Evento",
        sortable: true,
        width: "25%",
      },
      {
        key: "side" as keyof Bet,
        title: "Apuesta",
        render: (value: string) => (
          <span
            className={`font-medium ${value === "red" ? "text-red-500" : "text-blue-500"}`}
          >
            {value === "red" ? "🔴 Rojo" : "🔵 Azul"}
          </span>
        ),
        width: "20%",
      },
      {
        key: "amount" as keyof Bet,
        title: "Monto",
        render: (value: number) => (
          <span className="font-mono text-green-400">${value.toFixed(2)}</span>
        ),
        sortable: true,
        align: "right" as const,
        width: "15%",
      },
      {
        key: "status" as keyof Bet,
        title: "Estado",
        render: (status: string) => <StatusChip status={status} />,
        width: "15%",
      },
      {
        key: "createdAt" as keyof Bet,
        title: "Fecha",
        render: (date: string) => new Date(date).toLocaleDateString("es-ES"),
        sortable: true,
        width: "25%",
      },
    ],
    [],
  );

  // Filter configuration
  const filterConfig = [
    {
      key: "status",
      label: "Estado",
      type: "select" as const,
      options: [
        { value: "", label: "Todos" },
        { value: "active", label: "Activa" },
        { value: "won", label: "Ganada" },
        { value: "lost", label: "Perdida" },
      ],
    },
    {
      key: "side",
      label: "Lado",
      type: "select" as const,
      options: [
        { value: "", label: "Todos" },
        { value: "red", label: "Rojo" },
        { value: "blue", label: "Azul" },
      ],
    },
    {
      key: "eventName",
      label: "Buscar evento",
      type: "text" as const,
    },
  ];

  // Filter bets based on active filters
  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      if (filters.status && bet.status !== filters.status) return false;
      if (filters.side && bet.side !== filters.side) return false;
      if (
        filters.eventName &&
        !bet.eventName.toLowerCase().includes(filters.eventName.toLowerCase())
      )
        return false;
      return true;
    });
  }, [bets, filters]);

  // Row actions
  const actions = onBetClick
    ? [
        {
          label: "Ver detalles",
          onClick: onBetClick,
          variant: "primary" as const,
        },
      ]
    : undefined;

  if (loading) return <LoadingSpinner size="sm" />;

  return (
    <AdvancedTable
      data={filteredBets}
      columns={columns}
      loading={loading}
      filters={filterConfig}
      onFiltersChange={setFilters}
      actions={actions}
      pagination={{
        page: 1,
        pageSize: 10,
        total: filteredBets.length,
        onPageChange: () => {},
      }}
      exportable={true}
      onExport={(format) => {
        console.log(`Exporting ${filteredBets.length} bets as ${format}`);
        // TODO: Implement export functionality
      }}
    />
  );
};

// 5. Export default correcto
export default BetHistoryTable;
