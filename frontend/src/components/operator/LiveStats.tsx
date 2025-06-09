import React from "react";
import { Activity, Users, TrendingUp } from "lucide-react";
import { useEvents } from "../../hooks/useApi";
import DataCard from "../shared/DataCard";

const formatCurrency = (amount: number) => `$${(amount || 0).toLocaleString()}`;

const LiveStats: React.FC = () => {
  const { events } = useEvents();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <DataCard
        title="Total Bets"
        value={events.length}
        size="sm"
        color="blue"
      />
      <DataCard title="Live Viewers" value={0} size="sm" color="red" />
      <DataCard
        title="Total Wagered"
        value={formatCurrency(0)}
        size="sm"
        color="blue"
      />
      <DataCard
        title="Avg. Odds"
        value={(0).toFixed(2)}
        size="sm"
        color="red"
      />
    </div>
  );
};

export default LiveStats;
