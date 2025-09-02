// frontend/src/components/admin/ArticleEditorForm.tsx
import React, { useState, useEffect } from 'react';
import { articlesAPI, venuesAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface ArticleEditorFormProps {
  article: any;
  onClose: () => void;
  onArticleSaved: (savedArticle: any) => void;
}

const ArticleEditorForm: React.FC<ArticleEditorFormProps> = ({ article, onClose, onArticleSaved }) => {
  const [formData, setFormData] = useState(article || {});
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(article || {
      title: '',
      content: '',
      summary: '',
      status: 'draft',
      venue_id: '',
      featured_image_url: '',
    });
    const fetchVenues = async () => {
      try {
        const venuesRes = await venuesAPI.getAll({ status: 'active', limit: 1000 });
        setVenues(venuesRes.data?.venues || []);
      } catch (err) {
        setError('Failed to load venues.');
      }
    };
    fetchVenues();
  }, [article]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      if (article) {
        response = await articlesAPI.update(article.id, formData);
      } else {
        response = await articlesAPI.create(formData);
      }
      onArticleSaved(response.data);
      onClose();
    } catch (err) {
      setError('Failed to save article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Summary</label>
        <textarea id="summary" name="summary" value={formData.summary} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
        <textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={10} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
      </div>
      <div>
        <label htmlFor="featured_image_url" className="block text-sm font-medium text-gray-700">Featured Image URL</label>
        <input type="text" id="featured_image_url" name="featured_image_url" value={formData.featured_image_url} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div>
        <label htmlFor="venue_id" className="block text-sm font-medium text-gray-700">Venue (Optional)</label>
        <select id="venue_id" name="venue_id" value={formData.venue_id || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option value="">Select a Venue</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorMessage error={error} />}

      <div className="flex justify-end space-x-3 mt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? <LoadingSpinner text="Saving..." /> : 'Save Article'}
        </button>
      </div>
    </form>
  );
};

export default ArticleEditorForm;