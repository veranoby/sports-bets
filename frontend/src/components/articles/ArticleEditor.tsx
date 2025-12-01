import React, { useState } from "react";
import Modal from "../shared/Modal";
import { FormField } from "../shared/FormField";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { uploadsAPI } from "../../services/api";
import type { ArticleFormData, ArticleFormErrors } from "../../types/article";
import {
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Info,
  Clock,
  CheckCircle,
  Send,
  Save,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";

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
  const plainTextContent = formData.content
    ? formData.content.replace(/<[^>]+>/g, " ").trim()
    : "";
  const wordCount = plainTextContent ? plainTextContent.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  const excerptLimit = 500;
  const excerptLength = formData.excerpt.length;
  const excerptProgress = Math.min(
    100,
    Math.round((excerptLength / excerptLimit) * 100 || 0),
  );

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
      <form
        onSubmit={onSubmit}
        className="space-y-6 max-h-[75vh] overflow-y-auto pr-1"
      >
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-6 shadow-lg shadow-slate-900/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Paso 1
                  </p>
                  <h3 className="text-lg font-semibold">Imagen destacada</h3>
                </div>
                <UploadCloud className="w-5 h-5 text-white/70" />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-36 h-36 object-cover rounded-2xl border border-white/20 shadow-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          onChange("featured_image", "");
                        }}
                        className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-red-600 shadow"
                        title="Eliminar imagen"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-36 h-36 rounded-2xl border border-dashed border-white/30 flex flex-col items-center justify-center gap-2 text-white/70">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={uploading}
                    className="block w-full text-sm text-white/80
                      file:mr-4 file:py-2.5 file:px-5
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-white file:text-slate-900
                      hover:file:bg-slate-100
                      file:cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <Loader2 className="w-4 h-4 animate-spin" /> Subiendo
                      imagen...
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
                    <span className="px-3 py-1 rounded-full border border-white/25">
                      JPG / PNG / WEBP
                    </span>
                    <span className="px-3 py-1 rounded-full border border-white/25">
                      1400 × 600 px
                    </span>
                    <span className="px-3 py-1 rounded-full border border-white/25">
                      Máximo 5 MB
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Aside */}
            <aside className="space-y-4">
              {adminRejectionMessage && formData.status === "draft" && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-rose-600">
                        Revisión pendiente
                      </h4>
                      <p className="text-sm text-rose-500">
                        {adminRejectionMessage}
                      </p>
                      <p className="text-xs text-rose-400 mt-2">
                        Corrige y vuelve a enviar para aprobación.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Estado
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Estado actual:{" "}
                    <strong className="uppercase ml-1">
                      {formData.status}
                    </strong>
                  </div>
                  <p>
                    Usa “Guardar borrador” para mantenerlo privado hasta
                    terminar.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Consejos rápidos
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• Mantén el resumen entre 1 y 3 oraciones.</li>
                  <li>• Usa subtítulos para secciones clave.</li>
                  <li>
                    • Añade imágenes ligeras dentro del contenido si es
                    necesario.
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          {/* Información básica */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Paso 2
                </p>
                <h3 className="text-lg font-semibold">Información básica</h3>
              </div>
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-slate-100 text-slate-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                label="Título"
                value={formData.title}
                onChange={(v) => onChange("title", String(v))}
                error={formErrors.title}
                required
                className="text-base"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">
                  Resumen
                </label>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <ReactQuill
                    theme="snow"
                    value={formData.excerpt}
                    onChange={(value) => onChange("excerpt", value)}
                    modules={{
                      toolbar: [
                        ["bold", "italic", "underline"],
                        [{ list: "bullet" }],
                        ["clean"],
                      ],
                    }}
                    formats={["bold", "italic", "underline", "list", "bullet"]}
                    placeholder="Describe brevemente el enfoque del artículo"
                    className="min-h-[120px]"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {excerptLength}/{excerptLimit} caracteres
                  </span>
                  <div className="w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        excerptProgress > 90
                          ? "bg-red-400"
                          : excerptProgress > 70
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                      }`}
                      style={{ width: `${excerptProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Editor de contenido */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Paso 3
                </p>
                <h3 className="text-lg font-semibold">Contenido</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Info className="w-4 h-4" /> {wordCount} palabras
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {readingTime} min aprox.
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
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
              <p className="text-red-500 text-sm mt-2">{formErrors.content}</p>
            )}
          </section>

          {/* Acciones */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-500">
                Guarda como borrador para continuar más tarde o envía a revisión
                editorial cuando esté listo.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {onSaveDraft && (
                  <button
                    type="button"
                    onClick={onSaveDraft}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border border-slate-200 btn btn-primary text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    <Save className="w-4 h-4" /> Guardar borrador
                  </button>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border border-rose-100 text-rose-500 btn btn-danger hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    <XCircle className="w-4 h-4" /> Cancelar
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white btn btn-secondary shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Enviar para revisión
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
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
