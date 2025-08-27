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
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
          {eventName}
        </h1>
      </div>
      <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100">
        <span className="text-sm font-medium text-gray-500 mr-1">
          PELEA ACTUAL:
        </span>
        <span className="text-lg font-bold text-red-500">
          {fightNumber} <span className="text-gray-500">de</span> {totalFights}
        </span>
      </div>
    </div>
  );
};

export default EventHeader;
