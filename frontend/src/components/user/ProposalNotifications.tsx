import { useState, useEffect, useCallback } from "react";
import { useWebSocketListener } from "../../hooks/useWebSocket";
import { useBets } from "../../hooks/useApi";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Proposal {
  id: string;
  proposer: { id: string; username: string };
  originalAmount: number;
  pagoAmount: number;
  createdAt: string;
}

const ProposalNotifications = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const { acceptProposal, rejectProposal, getPendingProposals } = useBets();

  const handleProposalReceived = useCallback((proposal: Proposal) => {
    setProposals((prev) => [proposal, ...prev]);
    setHasUnread(true);
  }, []);

  const handleProposalAccepted = useCallback((proposalId: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
  }, []);

  const handleProposalRejected = useCallback((proposalId: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
  }, []);

  const handleBetProposalUpdate = useCallback(
    (data: { proposalId: string }) => {
      console.log("Actualización de propuesta:", data);
    },
    [],
  );

  useEffect(() => {
    getPendingProposals().then(setProposals);
  }, []);

  useWebSocketListener("proposal:received", handleProposalReceived);
  useWebSocketListener("proposal:accepted", handleProposalAccepted);
  useWebSocketListener("proposal:rejected", handleProposalRejected);
  useWebSocketListener("bet_proposal_update", handleBetProposalUpdate);

  const handleAccept = async (proposalId: string) => {
    await acceptProposal(proposalId);
  };

  const handleReject = async (proposalId: string) => {
    await rejectProposal(proposalId);
  };

  return (
    <div className="space-y-2">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="p-4 bg-[#2a325c] rounded-lg">
          <div className="flex justify-between">
            <span className="font-medium">{proposal.proposer.username}</span>
            <span className="text-gray-400 text-sm">
              {formatDistanceToNow(new Date(proposal.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
          <div className="my-2">
            <p>Original: ${proposal.originalAmount.toFixed(2)}</p>
            <p>PAGO: ${proposal.pagoAmount.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(proposal.id)}
              className="px-3 py-1 bg-[#596c95] rounded text-sm"
            >
              Aceptar
            </button>
            <button
              onClick={() => handleReject(proposal.id)}
              className="px-3 py-1 bg-[#cd6263] rounded text-sm"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProposalNotifications;
