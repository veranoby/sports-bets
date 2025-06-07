import { useState, useEffect } from "react";
import { eventsAPI } from "../config/api";

export const useFetchEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar eventos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchEvents();
  }, []);

  return { events, isLoading, error, refetchEvents };
};
