import React, { useState } from "react";
import Modal from "../shared/Modal";
import { FormField } from "../shared/FormField";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { uploadsAPI } from "../../services/api";
import type { ArticleFormData, ArticleFormErrors } from "../../types/article";

interface ArticleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: ArticleFormData;
  formErrors: ArticleFormErrors;
  onChange: (field: keyof ArticleFormData, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSaveDraft?: (e: React.FormEvent) => void; // Optional property for saving drafts
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
  onSaveDraft,
  submitting,
  isEditing,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    formData.featured_image || null,
  );
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        // Upload the file to the server
        const response = await uploadsAPI.uploadImage(file);
        if (response.success && response.data) {
          const imageUrl = response.data.url;
          setImagePreview(imageUrl);
          onChange("featured_image", imageUrl);
        } else {
          console.error("Upload failed:", response.message);
          alert("Error uploading image. Please try again.");
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Error uploading image. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="4xl">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Header Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500">
            Imagen Destacada
          </label>
          <div className="flex items-start gap-6">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-400 file:text-white
                  hover:file:bg-blue-700
                  file:cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploading && (
                <p className="mt-2 text-xs text-blue-500">Subiendo imagen...</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Formatos: JPG, PNG, WEBP. Tamaño recomendado: 1200 x 630
                píxeles. Máximo 5MB.
              </p>
              {(formData.featured_image || imagePreview) && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    onChange("featured_image", "");
                  }}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  Eliminar imagen
                </button>
              )}
            </div>
          </div>
        </div>

        <FormField
          label="Título"
          value={formData.title}
          onChange={(v) => onChange("title", String(v))}
          error={formErrors.title}
          required
          className="text-lg font-semibold"
        />

        <FormField
          label="Resumen"
          type="textarea"
          value={formData.excerpt}
          onChange={(v) => onChange("excerpt", String(v))}
          error={formErrors.excerpt}
          required
        />
        <div className="text-xs text-gray-500">
          {formData.excerpt.length}/500 caracteres
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Contenido
          </label>
          <div className="border border-gray-600 rounded-lg overflow-hidden bg-white">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) => onChange("content", value)}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, 4, 5, 6, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  [{ indent: "-1" }, { indent: "+1" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
              formats={[
                "header",
                "bold",
                "italic",
                "underline",
                "strike",
                "list",
                "bullet",
                "indent",
                "link",
                "image",
              ]}
              placeholder="Escribe el contenido del artículo aquí..."
              className="h-64"
            />
          </div>
          {formErrors.content && (
            <p className="text-red-500 text-sm">{formErrors.content}</p>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          {/* Draft Checkbox */}
          <div className="flex items-center">
            <input
              id="isDraft"
              name="isDraft"
              type="checkbox"
              checked={formData.status === "draft"}
              onChange={(e) =>
                onChange("status", e.target.checked ? "draft" : "pending")
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="isDraft"
              className="ml-2 block text-sm text-gray-400"
            >
              Guardar como Borrador
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancelar
            </button>
            {onSaveDraft && (
              <button
                type="button"
                onClick={onSaveDraft}
                className="btn-outline"
                disabled={submitting}
              >
                Guardar Borrador
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting
                ? "Guardando..."
                : formData.status === "draft"
                  ? "Guardar Borrador"
                  : "Enviar para Revisión"}
            </button>
          </div>
        </div>
      </form>
      <style>{`
        .ql-editor {
          min-height: 200px;
        }
        .ql-container {
          height: auto;
          min-height: 200px;
        }
      `}</style>
    </Modal>
  );
};

export default ArticleEditor;
