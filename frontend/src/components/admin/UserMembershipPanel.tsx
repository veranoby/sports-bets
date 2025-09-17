import React, { useState } from 'react';
import { Select, Button, Modal, notification } from 'antd';
import { Crown, Clock, User } from 'lucide-react';
import { adminAPI } from '../../services/api';
import type { UserSubscription } from '../../types'; // CORRECTED: Added 'type'

interface UserMembershipPanelProps {
  userId: string;
  currentMembership: UserSubscription | null | undefined;
  onMembershipUpdated: () => void;
}

const UserMembershipPanel: React.FC<UserMembershipPanelProps> = ({
  userId,
  currentMembership, 
  onMembershipUpdated
}) => {
  const [selectedType, setSelectedType] = useState<string>('free');
  const [assignedUsername, setAssignedUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

  const membershipOptions = [
    { value: 'free', label: 'Free', icon: <User className="w-4 h-4" /> },
    { value: '24h', label: '24 Hours Premium', icon: <Clock className="w-4 h-4" /> },
    { value: 'monthly', label: '1 Month Premium', icon: <Crown className="w-4 h-4" /> }
  ];

  const handleUpdate = async () => {
    if (!assignedUsername.trim()) {
      notification.error({ message: 'Username assignment is required' });
      return;
    }

    setLoading(true);
    try {
      await adminAPI.updateUserMembership(userId, {
        membership_type: selectedType,
        assigned_username: assignedUsername.trim()
      });

      notification.success({ message: `Membership updated to ${selectedType}` });
      setConfirmVisible(false);
      onMembershipUpdated();
    } catch (error) {
      console.error('Membership update error:', error);
      notification.error({ message: 'Failed to update membership' });
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h4 className="font-medium mb-3">Membership Management</h4>

      {currentMembership && (
        <div className="mb-4 text-sm">
          <p><strong>Current:</strong> {currentMembership.status}</p>
          {currentMembership.expiresAt && (
            <p><strong>Expires:</strong> {new Date(currentMembership.expiresAt).toLocaleString()}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">New Membership Type</label>
          <Select
            value={selectedType}
            onChange={setSelectedType}
            className="w-full"
            options={membershipOptions.map(opt => ({
              ...opt,
              label: <span className="flex items-center gap-2">{opt.icon} {opt.label}</span>
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Assigned Username</label>
          <input
            type="text"
            value={assignedUsername}
            onChange={(e) => setAssignedUsername(e.target.value)}
            placeholder="Username for this membership"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <Button
          type="primary"
          onClick={() => setConfirmVisible(true)}
          disabled={!assignedUsername.trim()}
          className="w-full"
        >
          Update Membership
        </Button>
      </div>

      <Modal
        title="Confirm Membership Update"
        open={confirmVisible}
        onOk={handleUpdate}
        onCancel={() => setConfirmVisible(false)}
        confirmLoading={loading}
      >
        <p>Update membership to <strong>{selectedType}</strong> for user <strong>{assignedUsername}</strong>?</p>
      </Modal>
    </div>
  );
};

export default UserMembershipPanel;
