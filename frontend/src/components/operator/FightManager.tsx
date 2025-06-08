import { useEffect } from "react";
import { useFights } from "../../hooks/useApi";
import type { Fight } from "../../types";
import LoadingSpinner from "../shared/LoadingSpinner";
import FightsList from "./FightsList";
import FightForm from "./FightForm";

interface FightManagerProps {
  eventId: string;
}

export const FightManager = ({ eventId }: FightManagerProps) => {
  const { fights, fetchFights, createFight, updateFight, loading, error } =
    useFights();

  useEffect(() => {
    fetchFights({ eventId });
  }, [eventId]);

  const handleCreate = async (fightData: Omit<Fight, "id">) => {
    await createFight(fightData);
    fetchFights({ eventId }); // Refresh list
  };

  const handleUpdate = async (fightId: string, updates: Partial<Fight>) => {
    await updateFight(fightId, updates);
    fetchFights({ eventId }); // Refresh list
  };

  if (loading) return <LoadingSpinner text="Loading fights..." />;
  if (error) return <div>Error: {error.message}</div>;

  const [selectedFight, setSelectedFight] = useState<Fight | null>(null);

  return (
    <div className="space-y-4">
      <FightsList
        fights={fights}
        type="upcoming"
        onSelectFight={setSelectedFight}
      />
      {selectedFight && <FightForm fight={selectedFight} />}
    </div>
  );
};
