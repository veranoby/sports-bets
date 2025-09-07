// frontend/src/components/admin/CreateFightModal.tsx
import React, { useState } from 'react';
import { fightsAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface CreateFightModalProps {
  eventId: string;
  onClose: () => void;
  onFightCreated: (newFight: any) => void;
}

const CreateFightModal: React.FC<CreateFightModalProps> = ({ eventId, onClose, onFightCreated }) => {
  const [redCorner, setRedCorner] = useState('');
  const [blueCorner, setBlueCorner] = useState('');
  const [weight, setWeight] = useState('');
  const [number, setNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});

  const validateForm = () => {
    const errors: any = {};
    if (!redCorner) errors.redCorner = 'Red corner is required.';
    if (!blueCorner) errors.blueCorner = 'Blue corner is required.';
    if (redCorner === blueCorner && redCorner !== '') {
        errors.blueCorner = 'Blue corner must be different from red corner.';
    }
    if (!weight) errors.weight = 'Weight is required.';
    if (!number) errors.number = 'Fight number is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const fightData = {
        eventId,
        redCorner,
        blueCorner,
        weight: parseFloat(weight),
        number: parseInt(number),
        notes,
      };
      const response = await fightsAPI.create(fightData);
      onFightCreated(response.data);
      onClose();
    } catch (err) {
      setError('Failed to create fight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Create New Fight</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700">Fight Number</label>
            <input type="number" id="number" value={number} onChange={(e) => setNumber(e.target.value)} className={`mt-1 block w-full px-3 py-2 border ${formErrors.number ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
            {formErrors.number && <p className="text-xs text-red-500 mt-1">{formErrors.number}</p>}
          </div>
          <div>
            <label htmlFor="redCorner" className="block text-sm font-medium text-gray-700">Red Corner</label>
            <input type="text" id="redCorner" value={redCorner} onChange={(e) => setRedCorner(e.target.value)} className={`mt-1 block w-full px-3 py-2 border ${formErrors.redCorner ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
            {formErrors.redCorner && <p className="text-xs text-red-500 mt-1">{formErrors.redCorner}</p>}
          </div>
          <div>
            <label htmlFor="blueCorner" className="block text-sm font-medium text-gray-700">Blue Corner</label>
            <input type="text" id="blueCorner" value={blueCorner} onChange={(e) => setBlueCorner(e.target.value)} className={`mt-1 block w-full px-3 py-2 border ${formErrors.blueCorner ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
            {formErrors.blueCorner && <p className="text-xs text-red-500 mt-1">{formErrors.blueCorner}</p>}
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input type="number" step="0.01" id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} className={`mt-1 block w-full px-3 py-2 border ${formErrors.weight ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} />
            {formErrors.weight && <p className="text-xs text-red-500 mt-1">{formErrors.weight}</p>}
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
          </div>

          {error && <ErrorMessage error={error} />}

          <div className="flex justify-end space-x-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? <LoadingSpinner text="Creating..." /> : 'Create Fight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFightModal;