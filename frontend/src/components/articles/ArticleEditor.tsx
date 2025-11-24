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
  adminRejectionMessage?: string; // Admin feedback when article was rejected
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
  adminRejectionMessage,
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
        {/* Admin Rejection Feedback */}
        {adminRejectionMessage && formData.status === "draft" && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-1">
                  Artículo Rechazado por el Administrador
                </h4>
                <p className="text-sm text-red-700">{adminRejectionMessage}</p>
                <p className="text-xs text-red-600 mt-2 italic">
                  Por favor, realiza las correcciones necesarias y vuelve a enviar para revisión.
                </p>
              </div>
            </div>
          </div>
        )}

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

        <div className="mt-6 space-y-3">
          <p className="text-xs text-gray-400">
            Guarda como borrador para continuar luego o envía directamente a
            revisión editorial.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              Cancelar
            </button>
            <div className="flex flex-wrap gap-3">
              {onSaveDraft && (
                <button
                  type="button"
                  onClick={onSaveDraft}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  Guardar como Borrador
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "Guardando..." : "Enviar para Revisión"}
              </button>
            </div>
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
