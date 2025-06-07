import { useEvents } from "../../../hooks/useEvents";

export const useEventActions = () => {
  const { createEvent, updateEvent, deleteEvent } = useEvents();

  const handleCreate = async (eventData: Omit<Event, "id">) => {
    try {
      await createEvent(eventData);
      return { success: true, message: "Evento creado" };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || "Error al crear evento",
        color: "#cd6263", // Rojo oficial para errores
      };
    }
  };

  const handleUpdate = async (id: string, eventData: Partial<Event>) => {
    try {
      await updateEvent(id, eventData);
      return { success: true, message: "Evento actualizado" };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || "Error al actualizar",
        color: "#cd6263",
      };
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      return { success: true, message: "Evento eliminado" };
    } catch (error) {
      return {
        success: false,
        message: (error as Error).message || "Error al eliminar",
        color: "#cd6263",
      };
    }
  };

  return { handleCreate, handleUpdate, handleDelete };
};
