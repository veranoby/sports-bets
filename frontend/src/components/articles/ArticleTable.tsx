import React from "react";
import { Eye, Edit, Archive, Trash2 } from "lucide-react";
import type { Article } from "../../types/article";

interface ArticleTableProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onPreview: (article: Article) => void;
  onArchive: (article: Article) => void;
  onDelete: (articleId: string) => void;
}

const ArticleTable: React.FC<ArticleTableProps> = ({
  articles,
  onEdit,
  onPreview,
  onArchive,
  onDelete,
}) => {
  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-green-500/20 text-green-600",
      draft: "bg-yellow-500/20 text-yellow-400",
      pending: "bg-blue-500/20 text-blue-600",
      archived: "bg-gray-500/20 text-gray-400",
    };
    const labels = {
      published: "Publicado",
      draft: "Borrador",
      pending: "Pendiente",
      archived: "Archivado",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
              Título
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
              Estado
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
              Fecha
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr
              key={article.id}
              className="border-b border-gray-800 hover:bg-[#2a325c]/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {article.featured_image && (
                    <img
                      src={article.featured_image}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <span className="text-sm font-medium text-theme-primary">
                    {article.title}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">{getStatusBadge(article.status)}</td>
              <td className="py-3 px-4 text-sm text-gray-400">
                {new Date(article.created_at).toLocaleDateString("es-ES")}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onPreview(article)}
                    className="p-1.5 text-blue-600 hover:bg-blue-500/20 rounded"
                    title="Vista previa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(article)}
                    className="p-1.5 text-yellow-400 hover:bg-yellow-500/20 rounded"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onArchive(article)}
                    className="p-1.5 text-gray-400 hover:bg-gray-500/20 rounded"
                    title="Archivar"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(article.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleTable;
