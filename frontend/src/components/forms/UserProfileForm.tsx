import React, { useState, useEffect } from "react";
import { userAPI } from "../../services/api";
import type { User } from "../../types";

interface ProfileInfo {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  [key: string]: string | boolean | undefined;
}

interface FormData {
  email: string;
  profileInfo: ProfileInfo;
}

interface UserProfileFormProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: user.email || "",
    profileInfo: {
      firstName: user.profileInfo?.fullName?.split(" ")[0] || "",
      lastName: user.profileInfo?.fullName?.split(" ").slice(1).join(" ") || "",
      phone: user.profileInfo?.phoneNumber || "",
      address: user.profileInfo?.address || "",
      emergencyContact: "",
      emergencyPhone: "",
      emailAlerts: true,
      smsAlerts: false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.profileInfo.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.profileInfo.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (
      formData.profileInfo.phone &&
      !/^\+?[\d\s-()]+$/.test(formData.profileInfo.phone)
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccess(false);
    setErrors({});

    try {
      const response = await userAPI.update({
        email: formData.email,
        profileInfo: {
          fullName: `${formData.profileInfo.firstName} ${formData.profileInfo.lastName}`,
          phoneNumber: formData.profileInfo.phone,
          address: formData.profileInfo.address,
        },
      });

      onUpdate(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Profile update failed:", error);

      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: "Failed to update profile. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value }));
    } else if (name.startsWith("profileInfo.")) {
      const fieldName = name.replace("profileInfo.", "");
      setFormData((prev) => ({
        ...prev,
        profileInfo: {
          ...prev.profileInfo,
          [fieldName]: type === "checkbox" ? checked : value,
        },
      }));
    }

    // Clear error when user starts typing
    if (errors[name] || errors[name.replace("profileInfo.", "")]) {
      const fieldName = name.replace("profileInfo.", "");
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Helper component for input fields
  const InputField = (
    name: string,
    label: string,
    type: string = "text",
    required: boolean = false,
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={`profileInfo.${name}`}
        value={String(formData.profileInfo[name] || "")}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-lg ${errors[name] ? "border-red-500" : "border-gray-300"}`}
        required={required}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
      )}
    </div>
  );

  // Helper component for checkbox fields
  const CheckboxField = (name: string, label: string) => (
    <div className="flex items-center">
      <input
        type="checkbox"
        name={`profileInfo.${name}`}
        checked={Boolean(formData.profileInfo[name])}
        onChange={handleChange}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label className="ml-2 text-sm text-gray-700">{label}</label>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Profile Settings
      </h2>

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Profile updated successfully!
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Account Information
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${errors.email ? "border-red-500" : "border-gray-300"}`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {InputField("firstName", "First Name", "text", true)}
            {InputField("lastName", "Last Name", "text", true)}
            {InputField("phone", "Phone Number", "tel")}
          </div>
          <div className="mt-4">{InputField("address", "Address", "text")}</div>
        </div>

        {/* Emergency Contact */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {InputField("emergencyContact", "Emergency Contact Name")}
            {InputField("emergencyPhone", "Emergency Contact Phone", "tel")}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Notification Preferences
          </h3>
          <div className="space-y-3">
            {CheckboxField("emailAlerts", "Receive email notifications")}
            {CheckboxField("smsAlerts", "Receive SMS notifications")}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;
