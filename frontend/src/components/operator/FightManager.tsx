import { useEffect, useState } from "react";
import { useFights } from "../../hooks/useApi";
import type { Fight } from "../../types";
import LoadingSpinner from "../shared/LoadingSpinner";
import FightsList from "./FightsList";
import ErrorMessage from "../shared/ErrorMessage";
import FightDetailModal from "./FightDetailModal";

interface FightManagerProps {
  eventId: string;
}

export const FightManager = ({ eventId }: FightManagerProps) => {
  const {
    fights,
    fetchFights,
    openBetting,
    closeBetting,
    recordResult,
    loading,
    error,
  } = useFights();
  const [selectedFight, setSelectedFight] = useState<Fight | null>(null);

  useEffect(() => {
    fetchFights({ eventId });
  }, [eventId]);

  if (loading) return <LoadingSpinner text="Loading fights..." />;
  if (error)
    return (
      <ErrorMessage error={error} onRetry={() => fetchFights({ eventId })} />
    );

  return (
    <div className="space-y-4">
      <FightsList
        fights={fights}
        type="upcoming"
        onSelectFight={(fightId) => {
          const fight = fights.find((f) => f.id === fightId) || null;
          setSelectedFight(fight);
        }}
      />
      {selectedFight && (
        <FightDetailModal
          fight={selectedFight}
          onClose={() => setSelectedFight(null)}
          onOpenBetting={async (fightId) => {
            await openBetting(fightId);
            fetchFights({ eventId });
          }}
          onCloseBetting={async (fightId) => {
            await closeBetting(fightId);
            fetchFights({ eventId });
          }}
          onRecordResult={async (fightId, result) => {
            await recordResult(fightId, result as "red" | "blue" | "draw");
            fetchFights({ eventId });
          }}
        />
      )}
    </div>
  );
};

export default FightManager;
