import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArticleEditor from "../../components/articles/ArticleEditor";
import { articlesAPI } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import type { ArticleFormData, ArticleFormErrors } from "../../types/article";

const CreateArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(true); // Open by default
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    content: "",
    excerpt: "",
    featured_image: "",
    status: "pending",
  });
  const [formErrors, setFormErrors] = useState<ArticleFormErrors>({});

  const handleFormChange = (field: keyof ArticleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ArticleFormErrors = {};
    if (!formData.title.trim()) errors.title = "El título es obligatorio.";
    if (!formData.excerpt.trim()) errors.excerpt = "El resumen es obligatorio.";
    if (formData.excerpt.length > 500)
      errors.excerpt = "El resumen no puede exceder los 500 caracteres.";
    if (!formData.content.trim() || formData.content === "<p><br></p>") {
      errors.content = "El contenido no puede estar vacío.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await articlesAPI.create({
        title: formData.title,
        content: formData.content,
        summary: formData.excerpt, // Correct mapping
        featured_image_url: formData.featured_image,
        status: "pending",
      });
      navigate("/user/articles?created=true");
    } catch (error) {
      console.error("Error creating article:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    navigate("/user/articles");
  };

  if (!user) {
    return <div>Debes iniciar sesión para crear artículos</div>;
  }

  return (
    <ArticleEditor
      isOpen={isModalOpen}
      onClose={handleClose}
      title="Crear Nuevo Artículo"
      formData={formData}
      formErrors={formErrors}
      onChange={handleFormChange}
      onSubmit={handleSave}
      submitting={loading}
      isEditing={false}
    />
  );
};

export default CreateArticlePage;
