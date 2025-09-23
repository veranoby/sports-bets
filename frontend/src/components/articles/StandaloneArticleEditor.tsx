import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FormField } from '../shared/FormField';

interface StandaloneArticleEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialSummary?: string;
  onSave: (data: { title: string; content: string; summary: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const StandaloneArticleEditor: React.FC<StandaloneArticleEditorProps> = ({
  initialContent = '',
  initialTitle = '',
  initialSummary = '',
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [summary, setSummary] = useState(initialSummary);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('El título es obligatorio');
      return;
    }

    if (!content.trim() || content === '<p><br></p>') {
      alert('El contenido no puede estar vacío');
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        content: content,
        summary: summary.trim() || generateSummary(content)
      });
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const generateSummary = (htmlContent: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    return plainText.slice(0, 160) + (plainText.length > 160 ? '...' : '');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header Image Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
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
              <div className="w-32 h-32 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                file:cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500">
              Selecciona una imagen para el artículo. Formatos recomendados: JPG, PNG, WEBP.
            </p>
            {imagePreview && (
              <button
                type="button"
                onClick={() => setImagePreview(null)}
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
        value={title}
        onChange={(v) => setTitle(String(v))}
        required
        className="text-lg font-semibold"
      />

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
          Resumen (opcional)
        </label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Breve resumen del artículo (se generará automáticamente si se deja vacío)"
          rows={3}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="text-xs text-gray-500 mt-1">
          {summary.length}/200 caracteres
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Contenido
        </label>
        <div className="border border-gray-600 rounded-lg overflow-hidden bg-white">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
              ],
            }}
            formats={[
              'header',
              'bold', 'italic', 'underline', 'strike',
              'list', 'bullet',
              'indent',
              'link', 'image'
            ]}
            placeholder="Escribe el contenido del artículo aquí..."
            className="h-64"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Guardando..." : "Guardar Artículo"}
        </button>
      </div>

      <style>{`
        .ql-editor {
          min-height: 200px;
        }
        .ql-container {
          height: auto;
          min-height: 200px;
        }
      `}</style>
    </div>
  );
};

export default StandaloneArticleEditor;