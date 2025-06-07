import { Plus, Edit, Trash2 } from "lucide-react";

interface EventActionsProps {
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const EventActions = ({
  onAdd,
  onEdit,
  onDelete,
}: EventActionsProps) => (
  <div className="flex gap-2 mb-4">
    <button
      onClick={onAdd}
      className="bg-[#596c95] text-white p-2 rounded-lg flex items-center"
    >
      <Plus className="mr-2" size={16} /> Nuevo
    </button>
    <button
      onClick={onEdit}
      className="bg-[#596c95] text-white p-2 rounded-lg flex items-center"
    >
      <Edit className="mr-2" size={16} /> Editar
    </button>
    <button
      onClick={onDelete}
      className="bg-[#cd6263] text-white p-2 rounded-lg flex items-center"
    >
      <Trash2 className="mr-2" size={16} /> Eliminar
    </button>
  </div>
);
