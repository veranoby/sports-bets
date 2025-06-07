import { Search } from "lucide-react";

interface EventFiltersProps {
  onSearch: (term: string) => void;
  onStatusFilter: (status: string) => void;
}

export const EventFilters = ({
  onSearch,
  onStatusFilter,
}: EventFiltersProps) => (
  <div className="flex gap-4 mb-6">
    <div className="relative flex-grow">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar eventos..."
        className="w-full pl-10 pr-4 py-2 bg-[#2a325c] text-white rounded-lg"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
    <select
      className="bg-[#2a325c] text-white px-4 py-2 rounded-lg"
      onChange={(e) => onStatusFilter(e.target.value)}
    >
      <option value="">Todos</option>
      <option value="active">Activos</option>
      <option value="completed">Completados</option>
    </select>
  </div>
);
