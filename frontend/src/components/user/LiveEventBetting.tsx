import { useBets } from "../../hooks/useApi";
import { StreamPlayer } from "./StreamPlayer";
import { CreateBetModal } from "./CreateBetModal";
import { useState } from "react";
import { BetCard } from "./BetCard";

export const LiveEventBetting = ({ fightId }: { fightId: string }) => {
  const { availableBets, createBet } = useBets();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-4">
      <StreamPlayer fightId={fightId} />
      <button
        onClick={() => setShowModal(true)}
        className="bg-[#cd6263] text-white p-2 rounded"
      >
        Crear Apuesta
      </button>
      {showModal && (
        <CreateBetModal
          onCreate={createBet}
          onClose={() => setShowModal(false)}
        />
      )}
      <div className="space-y-2">
        {availableBets.map((bet) => (
          <BetCard key={bet.id} {...bet} />
        ))}
      </div>
    </div>
  );
};
