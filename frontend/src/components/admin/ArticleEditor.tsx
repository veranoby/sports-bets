import React, { useState, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, Eye, X } from 'lucide-react';

interface ArticleEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialSummary?: string;
  onSave: (data: { title: string; content: string; summary: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({
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
  const [showPreview, setShowPreview] = useState(false);

  // Configuración del editor Quill
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ];

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

  // Generar resumen automático si no se proporciona
  const generateSummary = (htmlContent: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    return plainText.slice(0, 160) + (plainText.length > 160 ? '...' : '');
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  if (showPreview) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="border-b bg-gray-50 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Vista Previa del Artículo</h2>
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
              Cerrar Vista Previa
            </button>
          </div>
          
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || 'Título del artículo'}</h1>
            {summary && (
              <p className="text-lg text-gray-600 mb-6 italic">{summary}</p>
            )}
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content || '<p>Contenido del artículo...</p>' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="border-b bg-gray-50 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Editor de Artículos</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Vista Previa
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ingrese el título del artículo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Resumen */}
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

          {/* Editor de contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido *
            </label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Escriba el contenido del artículo aquí..."
                style={{
                  minHeight: '400px'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estilos personalizados para Quill */}
      <style>{`
        .ql-editor {
          min-height: 350px;
          font-size: 16px;
          line-height: 1.6;
        }
        .ql-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
        }
        .ql-container {
          border-bottom: none !important;
          border-left: none !important;
          border-right: none !important;
        }
        .prose {
          color: #374151;
        }
        .prose h1 {
          color: #111827;
        }
        .prose h2 {
          color: #111827;
        }
        .prose h3 {
          color: #111827;
        }
        .prose h4 {
          color: #111827;
        }
        .prose strong {
          color: #111827;
        }
      `}</style>
    </div>
  );
};

export default ArticleEditor;