import React, { useState, useEffect } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { articlesAPI, venuesAPI, gallerasAPI } from "../../config/api";
import { userAPI, uploadsAPI } from "../../services/api";
import type { Article } from "../../types/article";
import type { Venue, Gallera } from "../../types";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";

interface ArticleEditorFormProps {
  article: Article | null;
  onClose: () => void;
  onArticleSaved: (savedArticle: Article) => void;
}

const emptyArticle: Partial<Article> = {
  title: "",
  content: "",
  summary: "",
  status: "draft",
  featured_image_url: "",
  venue_id: undefined,
};

const ArticleEditorForm: React.FC<ArticleEditorFormProps> = ({
  article,
  onClose,
  onArticleSaved,
}) => {
  const [formData, setFormData] = useState<Partial<Article>>(emptyArticle);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [galleras, setGalleras] = useState<Gallera[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // For admin to select article author
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setFormData(article);
      setImagePreview(article.featured_image_url || null);
    }
    const fetchData = async () => {
      try {
        // Load venues and galleras for entity selection
        const [venuesRes, gallerasRes, usersRes] = await Promise.all([
          venuesAPI.getAll({ status: "active", limit: 1000 }),
          gallerasAPI.getAll({ status: "active", limit: 1000 }),
          userAPI.getAll({ limit: 1000 }) // Load all users for admin to assign articles
        ]);
        setVenues(venuesRes.data?.venues || []);
        setGalleras(gallerasRes.data?.galleras || []);
        setAllUsers(usersRes.data?.users || []); // All users for assigning article author
      } catch {
        setError("Failed to load venues, galleras, and users.");
      }
    };
    fetchData();
  }, [article]);

  const handleQuillChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  };

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
          setFormData((prev) => ({ ...prev, featured_image_url: imageUrl }));
        } else {
          console.error("Upload failed:", response.message);
          setError(response.message || "Error uploading image. Please try again.");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setError("Error uploading image. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, featured_image_url: undefined }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields before submission
    if (!formData.title || !formData.content || !formData.summary || !formData.author_id) {
      setError("Title, content, summary, and author are required fields.");
      setLoading(false);
      return;
    }

    try {
      let response;
      if (article && article.id) {
        // Editing mode: allow updating all fields
        const updatePayload = {
          title: formData.title,
          content: formData.content || "",
          excerpt: formData.summary,
          author_id: formData.author_id,
          featured_image_url: formData.featured_image_url,
          status: formData.status,
        };
        response = await articlesAPI.update(article.id, updatePayload);
      } else {
        // Creation mode: admin selects the author via the author_id field
        const createPayload = {
          title: formData.title,
          content: formData.content || "",
          excerpt: formData.summary,
          featured_image_url: formData.featured_image_url,
          status: formData.status, // Initially set to draft unless admin specifies otherwise
          author_id: formData.author_id, // Admin assigns article to selected user
        };
        response = await articlesAPI.create(createPayload);
      }
      onArticleSaved(response.data);
      onClose();
    } catch (error) {
      console.error("Error saving article:", error);
      setError("Failed to save article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      // Prevent default form submission since we handle everything with buttons
      // This is just in case someone presses Enter in a field
    }} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label
          htmlFor="summary"
          className="block text-sm font-medium text-gray-700"
        >
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        ></textarea>
      </div>
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          Content
        </label>
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <ReactQuill
            theme="snow"
            value={formData.content || ""}
            onChange={handleQuillChange}
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
              "clean",
            ]}
            className="h-[200px]"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Featured Image
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Image Preview */}
          <div className="flex-shrink-0">
            <div className="w-32 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>
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
            {(formData.featured_image_url || imagePreview) && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 text-xs text-red-400 hover:text-red-300"
              >
                Eliminar imagen
              </button>
            )}
          </div>
        </div>
      </div>
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        >
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="author_id"
          className="block text-sm font-medium text-gray-700"
        >
          Associated Entity (REQUIRED)
        </label>
        <select
          id="author_id"
          name="author_id"
          value={formData.author_id || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, author_id: e.target.value }))}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        >
          <option value="">Select an Author</option>
          <optgroup label="Admins">
            {allUsers
              .filter(user => user.role === 'admin')
              .map((user) => (
                <option key={`admin-${user.id}`} value={user.id}>
                  👑 {user.username} (admin)
                </option>
              ))}
          </optgroup>
          <optgroup label="Operators">
            {allUsers
              .filter(user => user.role === 'operator')
              .map((user) => (
                <option key={`op-${user.id}`} value={user.id}>
                  👔 {user.username} (operator)
                </option>
              ))}
          </optgroup>
          <optgroup label="Venues">
            {allUsers
              .filter(user => user.role === 'venue')
              .map((user) => (
                <option key={`venue-${user.id}`} value={user.id}>
                  🏟️ {user.username} (venue)
                </option>
              ))}
          </optgroup>
          <optgroup label="Galleras">
            {allUsers
              .filter(user => user.role === 'gallera')
              .map((user) => (
                <option key={`gall-${user.id}`} value={user.id}>
                  🐓 {user.username} (gallera)
                </option>
              ))}
          </optgroup>
          <optgroup label="Users">
            {allUsers
              .filter(user => user.role === 'user')
              .map((user) => (
                <option key={`usr-${user.id}`} value={user.id}>
                  👤 {user.username} (user)
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      {error && <ErrorMessage error={error} />}

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={async () => {
            // Save as Draft functionality
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.title || !formData.content || !formData.summary || !formData.author_id) {
              setError("Title, content, summary, and author are required fields.");
              setLoading(false);
              return;
            }

            try {
              let response;
              if (article && article.id) {
                // Update existing article with draft status
                const updatePayload = {
                  ...formData,
                  status: "draft",
                  content: formData.content || "",
                  excerpt: formData.summary,
                };
                response = await articlesAPI.update(article.id, updatePayload);
              } else {
                // Create new article with draft status
                const createPayload = {
                  title: formData.title,
                  content: formData.content || "",
                  excerpt: formData.summary,
                  featured_image_url: formData.featured_image_url,
                  status: "draft",
                  author_id: formData.author_id,
                };
                response = await articlesAPI.create(createPayload);
              }
              onArticleSaved(response.data);
              onClose();
            } catch (error) {
              console.error("Error saving draft:", error);
              setError("Failed to save as draft. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={async () => {
            // Submit for Review functionality
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.title || !formData.content || !formData.summary || !formData.author_id) {
              setError("Title, content, summary, and author are required fields.");
              setLoading(false);
              return;
            }

            try {
              let response;
              if (article && article.id) {
                // Update existing article with pending status
                const updatePayload = {
                  ...formData,
                  status: "pending",
                  content: formData.content || "",
                  excerpt: formData.summary,
                };
                response = await articlesAPI.update(article.id, updatePayload);
              } else {
                // Create new article with pending status
                const createPayload = {
                  title: formData.title,
                  content: formData.content || "",
                  excerpt: formData.summary,
                  featured_image_url: formData.featured_image_url,
                  status: "pending",
                  author_id: formData.author_id,
                };
                response = await articlesAPI.create(createPayload);
              }
              onArticleSaved(response.data);
              onClose();
            } catch (error) {
              console.error("Error submitting for review:", error);
              setError("Failed to submit for review. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Submit for Review
        </button>
        <button
          type="button"
          onClick={async () => {
            // Publish functionality (admin only)
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!formData.title || !formData.content || !formData.summary || !formData.author_id) {
              setError("Title, content, summary, and author are required fields.");
              setLoading(false);
              return;
            }

            try {
              let response;
              if (article && article.id) {
                // Update existing article with published status
                const updatePayload = {
                  ...formData,
                  status: "published",
                  content: formData.content || "",
                  excerpt: formData.summary,
                };
                response = await articlesAPI.update(article.id, updatePayload);
              } else {
                // Create new article with published status
                const createPayload = {
                  title: formData.title,
                  content: formData.content || "",
                  excerpt: formData.summary,
                  featured_image_url: formData.featured_image_url,
                  status: "published",
                  author_id: formData.author_id,
                };
                response = await articlesAPI.create(createPayload);
              }
              onArticleSaved(response.data);
              onClose();
            } catch (error) {
              console.error("Error publishing:", error);
              setError("Failed to publish. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Publish
        </button>
      </div>
    </form>
  );
};

export default ArticleEditorForm;
