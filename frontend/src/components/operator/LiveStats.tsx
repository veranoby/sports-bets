import React from "react";
import { Activity, Users, TrendingUp } from "lucide-react";
import { useEvents } from "../../hooks/useApi";
import Card from "../shared/Card";

const formatCurrency = (amount: number) => `$${(amount || 0).toLocaleString()}`;

const LiveStats: React.FC = () => {
  const { events } = useEvents();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        title="Apuestas Totales"
        value={events.length}
        size="sm"
        color="#596c95"
      />
      <Card title="Live Viewers" value={0} size="sm" color="red" />
      <Card
        title="Total Wagered"
        value={formatCurrency(0)}
        size="sm"
        color="blue"
      />
      <Card title="Avg. Odds" value={(0).toFixed(2)} size="sm" color="red" />
      <Card title="Problemas Técnicos" value={0} size="sm" color="#cd6263" />
    </div>
  );
};

export default LiveStats;
