import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { articlesAPI } from "../../config/api";
import type { User } from "../../types";
import Card from "../../components/shared/Card";
import { ArrowLeft, Upload, Save } from "lucide-react";

interface CreateArticleProps {
  user: User;
}

const CreateArticle: React.FC<CreateArticleProps> = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featured_image: "",
    venue_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido";
    }

    if (!formData.content.trim()) {
      newErrors.content = "El contenido es requerido";
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = "El resumen es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await articlesAPI.create({
        title: formData.title,
        content: formData.content,
        summary: formData.excerpt, // Correct mapping
        featured_image_url: formData.featured_image,
        venue_id: formData.venue_id || undefined,
      });
      navigate("/user/articles?created=true");
    } catch (error) {
      console.error("Error creating article:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors],
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Here you would typically upload to a cloud storage service
        // For now, we'll just create a local URL
        const imageUrl = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, featured_image: imageUrl }));
      }
    },
    [],
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/user/articles")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a mis artículos
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Crear Nuevo Artículo
        </h1>
        <p className="text-gray-600">
          Comparte tus experiencias y conocimientos sobre gallos de pelea
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Artículo *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Ingresa un título atractivo para tu artículo"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resumen *
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.excerpt ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Escribe un resumen corto que capture la atención..."
                  />
                  {errors.excerpt && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.excerpt}
                    </p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={15}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.content ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Escribe el contenido completo de tu artículo aquí..."
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.content}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Imagen Destacada
              </h3>
              <div className="space-y-4">
                {formData.featured_image && (
                  <div className="relative">
                    <img
                      src={formData.featured_image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, featured_image: "" }))
                      }
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {formData.featured_image
                        ? "Cambiar imagen"
                        : "Subir imagen"}
                    </span>
                  </label>
                </div>
                <input
                  type="url"
                  name="featured_image"
                  value={formData.featured_image}
                  onChange={handleChange}
                  placeholder="O pega una URL de imagen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </Card>

            {/* Venue Association */}
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Asociar con Gallera
              </h3>
              <select
                name="venue_id"
                value={formData.venue_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar gallera (opcional)</option>
                {/* In a real app, you'd fetch venues from API */}
                <option value="venue1">Gallera San Miguel</option>
                <option value="venue2">Gallera El Dorado</option>
                <option value="venue3">Gallera La Esperanza</option>
              </select>
            </Card>

            {/* Actions */}
            <Card>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Publicando..." : "Publicar Artículo"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user/articles")}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateArticle;
