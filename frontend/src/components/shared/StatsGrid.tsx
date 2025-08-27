import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card } from "./Card";
import { LoadingSpinner } from "./LoadingSpinner";
import { Line, Bar, Pie } from "react-chartjs-2"; // Asume instalación de Chart.js
import { StatCard, ChartDataset } from "@/types";

interface StatsGridProps {
  stats: StatCard[];
  layout?: "2x2" | "3x2" | "4x1" | "2x3";
  chartData?: ChartDataset[];
  chartType?: "line" | "bar" | "area" | "pie";
  period?: string;
  onPeriodChange?: (period: string) => void;
  loading?: boolean;
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  layout = "2x2",
  chartData,
  chartType = "line",
  period = "7D",
  onPeriodChange,
  loading = false,
  className = "",
}) => {
  // 1. Definir grid layout
  const gridClasses = {
    "2x2": "grid-cols-1 md:grid-cols-2",
    "3x2": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4x1": "grid-cols-1 lg:grid-cols-4",
    "2x3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  // 2. Renderizar mini-chart
  const renderMiniChart = (id: string) => {
    if (!chartData) return null;
    const data = chartData.find((d) => d.id === id);
    if (!data) return null;

    const chartProps = {
      data: {
        labels: data.labels,
        datasets: [{ ...data.dataset, borderColor: "#596c95" }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    };

    switch (chartType) {
      case "line":
        return <Line {...chartProps} />;
      case "bar":
        return <Bar {...chartProps} />;
      case "pie":
        return <Pie {...chartProps} />;
      default:
        return null;
    }
  };

  // 3. Renderizar trend indicator
  const renderTrend = (change: StatCard["change"]) => {
    if (!change) return null;
    const TrendIcon =
      change.direction === "up"
        ? ArrowUp
        : change.direction === "down"
        ? ArrowDown
        : Minus;
    const color =
      change.direction === "up"
        ? "text-green-500"
        : change.direction === "down"
        ? "text-red-500"
        : "text-gray-500";
    return (
      <div className={`flex items-center gap-1 text-sm ${color}`}>
        <TrendIcon size={14} />
        <span>{Math.abs(change.value)}%</span>
        <span className="text-gray-400">{change.period}</span>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Period selector */}
      <div className="flex gap-2">
        {["7D", "30D", "90D", "Custom"].map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange?.(p)}
            className={`px-3 py-1 rounded-lg ${
              period === p ? "bg-[#596c95] text-white" : "bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className={`grid ${gridClasses[layout]} gap-4`}>
          {[...Array(4)].map((_, i) => (
            <Card key={i} loading />
          ))}
        </div>
      ) : (
        <div className={`grid ${gridClasses[layout]} gap-4`}>
          {stats.map((stat) => (
            <Card
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.change?.direction}
              description={stat.description}
              variant="stat"
              color={stat.color}
              onClick={() => console.log(`Drill-down: ${stat.id}`)}
            >
              {renderMiniChart(stat.id)}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
