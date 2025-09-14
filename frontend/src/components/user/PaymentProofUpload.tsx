import React, { useState, useCallback } from 'react';
import { Upload, Button, Select, Input, notification } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { Upload as UploadIcon, CreditCard, DollarSign } from 'lucide-react';
import { userAPI } from '../../services/api';

interface PaymentProofUploadProps {
  onUploadSuccess?: () => void;
}

const PaymentProofUpload: React.FC<PaymentProofUploadProps> = ({ onUploadSuccess }) => {
  const [assignedUsername, setAssignedUsername] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'paypal'>('bank_transfer');
  const [uploading, setUploading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const paymentDescriptions = {
    bank_transfer: `galleros.net usuario ${assignedUsername} plan [24h/mensual]`,
    paypal: `galleros.net usuario ${assignedUsername} plan [tipo]`
  };

  const uploadProps = {
    name: 'payment_proof',
    multiple: false,
    fileList,
    beforeUpload: () => false, // Prevent auto upload
    onChange: ({ fileList: newFileList }: any) => {
      setFileList(newFileList.slice(-1)); // Keep only the latest file
    },
    accept: 'image/*'
  };

  const handleUpload = async () => {
    if (!assignedUsername.trim()) {
      notification.error({ message: 'Username assignment is required' });
      return;
    }

    if (fileList.length === 0) {
      notification.error({ message: 'Payment proof image is required' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('payment_proof', fileList[0].originFileObj);
      formData.append('assigned_username', assignedUsername.trim());
      formData.append('payment_description', paymentDescriptions[paymentMethod]);
      formData.append('payment_method', paymentMethod);

      await userAPI.uploadPaymentProof(formData);

      notification.success({
        message: 'Payment proof uploaded successfully',
        description: 'Admin will review and activate your membership'
      });

      // Reset form
      setFileList([]);
      setAssignedUsername('');
      onUploadSuccess?.();

    } catch (error) {
      notification.error({ message: 'Failed to upload payment proof' });
    }
    setUploading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <UploadIcon className="w-5 h-5" />
        Upload Payment Proof
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <Select
            value={paymentMethod}
            onChange={setPaymentMethod}
            className="w-full"
            options={[
              { value: 'bank_transfer', label: <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" />Bank Transfer</span> },
              { value: 'paypal', label: <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" />PayPal</span> }
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Username for Membership</label>
          <Input
            value={assignedUsername}
            onChange={(e) => setAssignedUsername(e.target.value)}
            placeholder="Your username"
            className="w-full"
          />
        </div>

        {assignedUsername && (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Suggested description:</strong><br />
              {paymentDescriptions[paymentMethod]}
            </p>
          </div>
        )}

        <div>
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag payment proof to upload</p>
            <p className="ant-upload-hint">Support for images only (JPG, PNG, etc)</p>
          </Upload.Dragger>
        </div>

        <Button
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={!assignedUsername.trim() || fileList.length === 0}
          className="w-full"
        >
          Upload Payment Proof
        </Button>
      </div>
    </div>
  );
};

export default PaymentProofUpload;
