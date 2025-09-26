// frontend/src/components/user/DetailModalConfigs.tsx
// ================================================================
// 🎯 CONFIGURACIONES: Para GenericDetailModal - preserva funcionalidades específicas

import type { FieldConfig, ActionConfig } from "../shared/GenericDetailModal";
import type { Bet, Transaction, Event } from "../../types";

interface Fighters {
  red: string;
  blue: string;
}

interface Venue {
  name: string;
}

// ============================================================================
// BET DETAIL CONFIGURATION - Preserva funcionalidad de BetDetailModal
// ============================================================================
export const BET_DETAIL_FIELDS: FieldConfig<Bet>[] = [
  {
    key: "id",
    label: "ID",
    copyable: true,
  },
  {
    key: "eventName",
    label: "Evento",
  },
  {
    key: "fighterNames",
    label: "Peleadores",
    render: (fighters: Fighters) => (
      <span>
        {fighters?.red || "N/A"} vs {fighters?.blue || "N/A"}
      </span>
    ),
  },
  {
    key: "amount",
    label: "Monto",
  },
  {
    key: "odds",
    label: "Cuota",
  },
  {
    key: "status",
    label: "Estado",
  },
  {
    key: "result",
    label: "Resultado",
  },
  {
    key: "createdAt",
    label: "Creada",
  },
];

export const getBetActions = (
  onCancelBet?: (betId: string) => void,
): ActionConfig<Bet>[] => [
  {
    label: "Cancelar apuesta",
    onClick: (bet: Bet) => onCancelBet?.(bet.id),
    variant: "danger",
    conditional: (bet: Bet) =>
      (bet.status === "pending" || bet.status === "active") && !!onCancelBet,
  },
];

// ============================================================================
// TRANSACTION DETAIL CONFIGURATION - Preserva funcionalidad de TransactionDetailModal
// ============================================================================
export const TRANSACTION_DETAIL_FIELDS: FieldConfig<Transaction>[] = [
  {
    key: "id",
    label: "ID",
  },
  {
    key: "type",
    label: "Tipo",
  },
  {
    key: "status",
    label: "Estado",
  },
  {
    key: "amount",
    label: "Monto",
  },
  {
    key: "description",
    label: "Descripción",
  },
  {
    key: "createdAt",
    label: "Fecha",
  },
  {
    key: "reference",
    label: "Referencia",
    conditional: (transaction: Transaction) => !!transaction.reference,
  },
];

// No actions específicas para Transaction actualmente
export const TRANSACTION_ACTIONS: ActionConfig<Transaction>[] = [];

// ============================================================================
// EVENT DETAIL CONFIGURATION - Preserva funcionalidad de EventDetailModal
// ============================================================================
export const EVENT_DETAIL_FIELDS: FieldConfig<Event>[] = [
  {
    key: "id",
    label: "ID",
    copyable: true,
  },
  {
    key: "name",
    label: "Nombre",
  },
  {
    key: "status",
    label: "Estado",
  },
  {
    key: "scheduledDate",
    label: "Fecha",
  },
  {
    key: "venue",
    label: "Venue",
    render: (venue: Venue | undefined, event: Event) => (
      <span>{venue?.name || event.venueId || "N/A"}</span>
    ),
  },
  {
    key: "totalFights",
    label: "Total de Peleas",
  },
  {
    key: "totalBets",
    label: "Apuestas",
  },
  {
    key: "totalPrizePool",
    label: "Premio acumulado",
  },
  {
    key: "createdAt",
    label: "Creado",
  },
];

export const getEventActions = (
  onActivateEvent?: (eventId: string) => void,
): ActionConfig<Event>[] => [
  {
    label: "Activar evento",
    onClick: (event: Event) => onActivateEvent?.(event.id),
    variant: "success",
    conditional: (event: Event) =>
      event.status === "scheduled" && !!onActivateEvent,
  },
];

// ============================================================================
// CONVENIENCE HOOKS - Para fácil uso en componentes
// ============================================================================
export const useBetDetailConfig = (onCancelBet?: (betId: string) => void) => ({
  fields: BET_DETAIL_FIELDS,
  actions: getBetActions(onCancelBet),
  title: "Detalle de Apuesta",
});

export const useTransactionDetailConfig = () => ({
  fields: TRANSACTION_DETAIL_FIELDS,
  actions: TRANSACTION_ACTIONS,
  title: "Detalle de Transacción",
});

export const useEventDetailConfig = (
  onActivateEvent?: (eventId: string) => void,
) => ({
  fields: EVENT_DETAIL_FIELDS,
  actions: getEventActions(onActivateEvent),
  title: "Detalle de Evento",
});
