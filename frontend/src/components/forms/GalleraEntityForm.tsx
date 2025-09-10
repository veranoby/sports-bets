// frontend/src/components/forms/GalleraEntityForm.tsx
// Formulario para editar información específica de la entidad Gallera

import React, { useState } from 'react';
import { gallerasAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import { MapPin, Trophy, Users } from 'lucide-react';

interface GalleraEntityFormProps {
  gallera?: any;
  userId: string;
  onSave: (galleraData: any) => void;
  onCancel: () => void;
}

const GalleraEntityForm: React.FC<GalleraEntityFormProps> = ({ gallera, userId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: gallera?.name || '',
    location: gallera?.location || '',
    description: gallera?.description || '',
    specialties: gallera?.specialties || {
      breeds: [],
      trainingMethods: [],
      experience: ''
    },
    activeRoosters: gallera?.active_roosters || 0,
    fightRecord: gallera?.fight_record || {
      wins: 0,
      losses: 0,
      draws: 0
    },
    images: gallera?.images || [],
    status: gallera?.status || 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('specialties.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specialties: {
          ...prev.specialties,
          [field]: value
        }
      }));
    } else if (name.startsWith('fightRecord.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        fightRecord: {
          ...prev.fightRecord,
          [field]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'activeRoosters' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (gallera?.id) {
        result = await gallerasAPI.update(gallera.id, {
          ...formData,
          ownerId: userId
        });
      } else {
        result = await gallerasAPI.create({
          ...formData,
          ownerId: userId
        });
      }
      onSave(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save gallera');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🐓</span>
        <h3 className="text-lg font-semibold text-gray-800">
          {gallera?.id ? 'Edit Gallera Information' : 'Create Gallera Information'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gallera Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description & Breeding Specialty
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your gallera's specialty, breeding methods, and experience..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Active Roosters
            </label>
            <input
              type="number"
              name="activeRoosters"
              value={formData.activeRoosters}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level
            </label>
            <input
              type="text"
              name="specialties.experience"
              value={formData.specialties.experience}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 10+ years"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Fight Record
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wins
              </label>
              <input
                type="number"
                name="fightRecord.wins"
                value={formData.fightRecord.wins}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Losses
              </label>
              <input
                type="number"
                name="fightRecord.losses"
                value={formData.fightRecord.losses}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Draws
              </label>
              <input
                type="number"
                name="fightRecord.draws"
                value={formData.fightRecord.draws}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && <ErrorMessage error={error} />}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              'Save Gallera'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GalleraEntityForm;