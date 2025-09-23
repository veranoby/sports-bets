import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StandaloneArticleEditor from '../../components/articles/StandaloneArticleEditor';
import { articlesAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const CreateArticlePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSave = async (data: { title: string; content: string; summary: string }) => {
    try {
      setLoading(true);
      await articlesAPI.create({
        title: data.title,
        content: data.content,
        excerpt: data.summary,
        status: 'pending'
      });
      navigate('/user/articles?created=true');
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/user/articles');
  };

  if (!user) {
    return <div>Debes iniciar sesión para crear artículos</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Crear Artículo</h1>
      <p className="text-gray-600 mb-6">
        Tu artículo será revisado por los administradores antes de ser publicado.
      </p>
      <StandaloneArticleEditor
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </div>
  );
};

export default CreateArticlePage;
