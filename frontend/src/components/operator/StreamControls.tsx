const StreamControls: React.FC = () => {
  const startStream = async (eventId: string) => {
    await fetch(`/api/events/${eventId}/stream/start`, { method: "POST" });
  };

  const stopStream = async (eventId: string) => {
    await fetch(`/api/events/${eventId}/stream/stop`, { method: "POST" });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => startStream("123")}
        className="bg-[#cd6263] text-white px-4 py-2 rounded-lg"
      >
        Iniciar Transmisión
      </button>
    </div>
  );
};
