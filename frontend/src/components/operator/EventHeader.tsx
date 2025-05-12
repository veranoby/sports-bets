// src/components/operator/EventHeader.tsx
import React from "react";

interface EventHeaderProps {
  eventName: string;
  fightNumber: number;
  totalFights: number;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  eventName,
  fightNumber,
  totalFights,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">EVENTO:</h2>
          <p className="text-2xl font-bold">{eventName}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold">PELEA ACTUAL:</h2>
          <p className="text-2xl font-bold">
            {fightNumber} de {totalFights}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventHeader;
