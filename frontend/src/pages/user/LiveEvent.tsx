import { useState } from "react";
import { ArrowLeft, Plus, Clock, Scale, Users, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Fight = {
  id: string;
  breeder1: string;
  breeder2: string;
  weight: number;
  status: "preliminar" | "en_curso" | "finalizado";
};

type Bet = {
  id: string;
  amount: number;
  odds: number;
  breeder: string;
  createdBy: string;
  createdAt: string;
};

const LiveEvent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"available" | "my_bets" | "info">(
    "available"
  );

  // Mock data
  const currentFight: Fight = {
    id: "fight-123",
    breeder1: "El Campeón",
    breeder2: "El Retador",
    weight: 2.5,
    status: "en_curso",
  };

  const availableBets: Bet[] = [
    {
      id: "bet-1",
      amount: 500,
      odds: 1.8,
      breeder: "El Campeón",
      createdBy: "Usuario123",
      createdAt: "2023-10-15T14:30:00Z",
    },
    {
      id: "bet-2",
      amount: 300,
      odds: 2.2,
      breeder: "El Retador",
      createdBy: "Usuario456",
      createdAt: "2023-10-15T14:35:00Z",
    },
  ];

  const myBets: Bet[] = [
    {
      id: "bet-3",
      amount: 200,
      odds: 1.9,
      breeder: "El Campeón",
      createdBy: "Yo",
      createdAt: "2023-10-15T14:25:00Z",
    },
  ];

  const handleAcceptBet = (betId: string) => {
    console.log(`Aceptando apuesta ${betId}`);
    // Lógica para aceptar apuesta
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-gray-700"
        >
          <ArrowLeft size={24} className="mr-2" />
          Volver al Dashboard
        </button>
        <h1 className="text-xl font-bold text-gray-800">Evento en Vivo</h1>
        <div className="w-6"></div> {/* Spacer para alinear */}
      </header>

      {/* Video Player */}
      <div className="aspect-video bg-black relative">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-lg">Transmisión en vivo simulada</p>
            <p className="text-sm text-gray-300 mt-2">Calidad: 720p</p>
          </div>
        </div>
      </div>

      {/* Fight Info */}
      <div className="bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Pelea Actual</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">{currentFight.breeder1}</p>
            <p className="text-gray-600">vs</p>
            <p className="font-medium">{currentFight.breeder2}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <Scale className="mr-2" size={16} />
              <span>{currentFight.weight} kg</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="mr-2" size={16} />
              <span>
                {currentFight.status === "en_curso"
                  ? "En curso"
                  : currentFight.status === "preliminar"
                  ? "Preliminar"
                  : "Finalizado"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === "available"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          <Users size={16} />
          <span>Disponibles</span>
        </button>
        <button
          onClick={() => setActiveTab("my_bets")}
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === "my_bets"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          <Clock size={16} />
          <span>Mis Apuestas</span>
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-3 font-medium flex items-center justify-center gap-2 ${
            activeTab === "info"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600"
          }`}
        >
          <Info size={16} />
          <span>Info</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "available" && (
          <div>
            <h3 className="font-semibold mb-3">Apuestas Disponibles</h3>
            <div className="space-y-3">
              {availableBets.map((bet) => (
                <div key={bet.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{bet.breeder}</p>
                      <p className="text-sm text-gray-600">
                        Monto: ${bet.amount}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cuota: {bet.odds}x
                      </p>
                    </div>
                    <button
                      onClick={() => handleAcceptBet(bet.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Aceptar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Creada por {bet.createdBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "my_bets" && (
          <div>
            <h3 className="font-semibold mb-3">Mis Apuestas</h3>
            {myBets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No tienes apuestas activas
              </p>
            ) : (
              <div className="space-y-3">
                {myBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-white p-3 rounded-lg shadow-sm"
                  >
                    <p className="font-medium">{bet.breeder}</p>
                    <p className="text-sm text-gray-600">
                      Monto: ${bet.amount}
                    </p>
                    <p className="text-sm text-gray-600">Cuota: {bet.odds}x</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Creada el {new Date(bet.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div>
            <h3 className="font-semibold mb-3">Información del Evento</h3>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-gray-700">
                Evento: Gran Campeonato Nacional de Gallos 2023
              </p>
              <p className="text-gray-700 mt-2">
                Ubicación: Arena Gallística Central
              </p>
              <p className="text-gray-700 mt-2">Hora: 15:00 - 22:00</p>
              <p className="text-gray-700 mt-2">
                Organizador: Asociación Nacional de Criadores
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create New Bet Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default LiveEvent;
