import { useState, useEffect } from "react";
import { apiClient } from "../config/api";

interface Event {
  id: string;
  venueName: string;
  isLive: boolean;
  dateTime: string;
  activeBettors: number;
  imageUrl?: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/events");
        setEvents(response.data.events);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const createEvent = async (eventData: Omit<Event, "id">) => {
    const res = await apiClient.post("/operator/events", eventData);
    return res.data;
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    const res = await apiClient.put(`/operator/events/${id}`, eventData);
    return res.data;
  };

  return { events, loading, error };
};
