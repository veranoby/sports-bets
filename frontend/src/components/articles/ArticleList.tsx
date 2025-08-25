import React from "react";
import { FileText, Plus, Edit, Eye, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import Card from "../../components/shared/Card";
import StatusChip from "../../components/shared/StatusChip";
import type { Article } from "../../types/article";

interface ArticleListProps {
  articles: Article[];
  articlesByStatus: {
    draft: Article[];
    pending: Article[];
    published: Article[];
    archived: Article[];
  };
  onOpenCreateModal: () => void;
  onOpenEditModal: (article: Article) => void;
  onOpenPreviewModal: (article: Article) => void;
  onDelete: (articleId: string) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  articlesByStatus,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenPreviewModal,
  onDelete,
}) => {
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes de Revisión</p>
              <p className="text-xl font-bold text-gray-900">{articlesByStatus.pending.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Publicados</p>
              <p className="text-xl font-bold text-gray-900">{articlesByStatus.published.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Borradores</p>
              <p className="text-xl font-bold text-gray-900">{articlesByStatus.draft.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Archivados</p>
              <p className="text-xl font-bold text-gray-900">{articlesByStatus.archived.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aún no tienes artículos</h3>
          <p className="text-gray-600 mb-6">Empieza a crear tu primer artículo para compartir con la comunidad.</p>
          <button
            onClick={onOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Primer Artículo
          </button>
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Todos tus Artículos</h2>
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Article Preview */}
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{article.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Creado: {new Date(article.created_at).toLocaleDateString()}</span>
                    {article.published_at && (
                      <span>Publicado: {new Date(article.published_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                  <StatusChip status={article.status} size="sm" />
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onOpenPreviewModal(article)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Previsualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {(article.status === "draft" || article.status === "pending") && (
                      <button
                        onClick={() => onOpenEditModal(article)}
                        className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {article.status === "draft" && (
                      <button
                        onClick={() => onDelete(article.id)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
};

export default ArticleList;
