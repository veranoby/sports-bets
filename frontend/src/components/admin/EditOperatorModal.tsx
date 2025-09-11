// frontend/src/components/admin/EditOperatorModal.tsx
// Modal para editar los detalles de un operador

import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../config/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import type { User } from '../../types';

interface EditOperatorModalProps {
  operator: User;
  onClose: () => void;
  onOperatorUpdated: (updatedOperator: User) => void;
}

const EditOperatorModal: React.FC<EditOperatorModalProps> = ({ operator, onClose, onOperatorUpdated }) => {
  const [formData, setFormData] = useState({
    fullName: operator.profileInfo?.fullName || '',
    phoneNumber: operator.profileInfo?.phoneNumber || '',
    address: operator.profileInfo?.address || '',
    identificationNumber: operator.profileInfo?.identificationNumber || '',
    is_active: operator.isActive
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      fullName: operator.profileInfo?.fullName || '',
      phoneNumber: operator.profileInfo?.phoneNumber || '',
      address: operator.profileInfo?.address || '',
      identificationNumber: operator.profileInfo?.identificationNumber || '',
      is_active: operator.isActive
    });
  }, [operator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev: any) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update user profile info
      await usersAPI.updateProfile({
        profileInfo: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          identificationNumber: formData.identificationNumber || operator.profileInfo?.identificationNumber,
          verificationLevel: operator.profileInfo?.verificationLevel || "none"
        }
      });
      
      // Update user status if changed
      if (formData.is_active !== operator.isActive) {
        await usersAPI.updateStatus(operator.id, formData.is_active);
      }
      onOperatorUpdated({
        ...operator,
        profileInfo: {
          ...operator.profileInfo,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          identificationNumber: formData.identificationNumber || operator.profileInfo?.identificationNumber,
          verificationLevel: operator.profileInfo?.verificationLevel || "none"
        },
        isActive: formData.is_active
      });
      onClose();
    } catch (err) {
      setError('Failed to update operator. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Edit Operator: {operator.username}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" id="username" name="username" value={operator.username} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" disabled />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" value={operator.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" disabled />
          </div>
          <div>
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="is_active" name="is_active" value={String(formData.is_active)} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {error && <ErrorMessage error={error} />}

          <div className="flex justify-end space-x-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? <LoadingSpinner text="Saving..." /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOperatorModal;
