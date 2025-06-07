import FightsList from "./FightsList";
import FightForm from "./FightForm";
import { useFights } from "../../hooks/useApi";

const FightManager: React.FC = () => {
  const [fights, setFights] = useState<Fight[]>([]);
  const [selectedFight, setSelectedFight] = useState<Fight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conectar con GET /api/fights
  useEffect(() => {
    fetchFights();
  }, []);

  const fetchFights = async (eventId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/fights?eventId=${eventId}`);
      setFights(response.data);
    } catch (err) {
      setError("Error al cargar peleas");
    } finally {
      setIsLoading(false);
    }
  };

  const openBetting = async (fightId: string) => {
    await fetch(`/api/fights/${fightId}/open-betting`, { method: "POST" });
  };

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

export default FightManager;
