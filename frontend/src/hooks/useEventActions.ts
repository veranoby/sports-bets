import { useEvents } from "./useApi";
import { Event } from "../types";
import { toast } from "react-toastify";

export const useEventActions = () => {
  const { createEvent, updateEvent, deleteEvent } = useEvents();

  const handleCreate = async (eventData: Omit<Event, "id">) => {
    try {
      const newEvent = await createEvent(eventData);
      toast.success("Evento creado exitosamente", {
        style: { backgroundColor: "#596c95", color: "white" },
      });
      return newEvent;
    } catch (error) {
      toast.error("Error al crear el evento", {
        style: { backgroundColor: "#cd6263", color: "white" },
      });
      throw error;
    }
  };

  const handleUpdate = async (eventId: string, eventData: Partial<Event>) => {
    try {
      const updatedEvent = await updateEvent(eventId, eventData);
      toast.success("Evento actualizado exitosamente", {
        style: { backgroundColor: "#596c95", color: "white" },
      });
      return updatedEvent;
    } catch (error) {
      toast.error("Error al actualizar el evento", {
        style: { backgroundColor: "#cd6263", color: "white" },
      });
      throw error;
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast.success("Evento eliminado exitosamente", {
        style: { backgroundColor: "#596c95", color: "white" },
      });
    } catch (error) {
      toast.error("Error al eliminar el evento", {
        style: { backgroundColor: "#cd6263", color: "white" },
      });
      throw error;
    }
  };

  return { handleCreate, handleUpdate, handleDelete };
};
