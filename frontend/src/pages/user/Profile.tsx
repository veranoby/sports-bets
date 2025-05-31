/**
 * Profile Component
 * Página de perfil del usuario con información personal y opciones de cuenta.
 */
"use client";

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
  });

  const handleSaveChanges = () => {
    // Lógica para guardar cambios
    console.log({
      fullName,
      birthDate,
      gender,
      address,
      phone,
      notifications,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="px-10 flex flex-1 justify-center py-5">
        <div className="w-full max-w-4xl py-5">
          {/* Header */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          </div>

          {/* Avatar and Basic Info */}
          <div className="flex p-4">
            <div className="w-full flex flex-col items-center">
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-32 h-32 rounded-full bg-cover bg-center bg-no-repeat border-2 border-gray-200"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/a/default-user")',
                  }}
                />
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {user?.username || "N/A"}
                  </p>
                  <p className="text-blue-600 text-base">
                    {user?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <h2 className="text-2xl font-bold text-gray-900 px-4 pb-3 pt-5">
            Personal Information
          </h2>

          <div className="max-w-2xl space-y-4 px-4">
            <div>
              <label className="block text-gray-900 font-medium pb-2">
                Full Name
              </label>
              <input
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-900 font-medium pb-2">
                Date of Birth
              </label>
              <input
                type="date"
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-900 font-medium pb-2">
                Gender
              </label>
              <select
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-900 font-medium pb-2">
                Address
              </label>
              <textarea
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 min-h-32"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-900 font-medium pb-2">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Notifications */}
          <h2 className="text-2xl font-bold text-gray-900 px-4 pb-3 pt-8">
            Notifications
          </h2>

          <div className="px-4 space-y-2">
            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-2 border-gray-300 checked:bg-blue-500 focus:ring-blue-500"
                checked={notifications.email}
                onChange={() =>
                  setNotifications({
                    ...notifications,
                    email: !notifications.email,
                  })
                }
              />
              <span className="text-gray-900">Receive email notifications</span>
            </label>

            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-2 border-gray-300 checked:bg-blue-500 focus:ring-blue-500"
                checked={notifications.sms}
                onChange={() =>
                  setNotifications({
                    ...notifications,
                    sms: !notifications.sms,
                  })
                }
              />
              <span className="text-gray-900">Receive SMS notifications</span>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex px-4 pb-20 justify-end">
            <button
              onClick={handleSaveChanges}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors mb-4"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
