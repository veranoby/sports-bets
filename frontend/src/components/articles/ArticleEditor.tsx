import React from "react";
import Modal from "../shared/Modal";
import { FormField } from "../shared/FormField";
import type { ArticleFormData, ArticleFormErrors } from "../../types/article";

interface ArticleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: ArticleFormData;
  formErrors: ArticleFormErrors;
  onChange: (field: keyof ArticleFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  isEditing: boolean;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  isOpen,
  onClose,
  title,
  formData,
  formErrors,
  onChange,
  onSubmit,
  submitting,
  isEditing,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          label="Título"
          value={formData.title}
          onChange={(v) => onChange("title", String(v))}
          error={formErrors.title}
          required
        />

        <FormField
          label="Resumen"
          type="textarea"
          value={formData.excerpt}
          onChange={(v) => onChange("excerpt", String(v))}
          error={formErrors.excerpt}
          required
        />

        <FormField
          label="URL de Imagen Destacada (opcional)"
          type="text"
          value={formData.featured_image || ""}
          onChange={(v) => onChange("featured_image", String(v))}
          error={formErrors.featured_image}
        />

        <FormField
          label="Contenido"
          type="textarea"
          value={formData.content}
          onChange={(v) => onChange("content", String(v))}
          error={formErrors.content}
          required
        />

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? (isEditing ? "Actualizando..." : "Creando...") : isEditing ? "Actualizar Artículo" : "Crear Artículo"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ArticleEditor;
