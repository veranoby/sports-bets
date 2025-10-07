// frontend/src/pages/admin/CreateEvent.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { venuesAPI, eventsAPI, usersAPI } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Card from "../../components/shared/Card";
import { ArrowLeft, HelpCircle } from "lucide-react";

interface Venue {
  id: string;
  name: string;
}

interface Operator {
  id: string;
  username: string;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [name, setName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [operatorId, setOperatorId] = useState<string | null>(null);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch venues and operators in parallel
        const [venuesRes, operatorsRes] = await Promise.all([
          venuesAPI.getAll({
            status: "active",
            limit: 1000,
          }),
          usersAPI.getOperators().catch(() => ({ data: { users: [] } })), // Handle potential error gracefully
        ]);

        setVenues(
          Array.isArray(venuesRes.data)
            ? venuesRes.data
            : venuesRes.data.venues || [],
        );

        // Extract operators from response
        const operatorsData = Array.isArray(operatorsRes.data)
          ? operatorsRes.data
          : operatorsRes.data.users || [];

        setOperators(operatorsData);

        // Set current user as default operator if they are an operator
        if (
          currentUser &&
          (currentUser.role === "admin" || currentUser.role === "operator")
        ) {
          setOperatorId(currentUser.id);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Event name is required";
    }

    if (!venueId) {
      errors.venueId = "Please select a venue";
    }

    if (!scheduledDate) {
      errors.scheduledDate = "Scheduled date is required";
    } else {
      const selectedDate = new Date(scheduledDate);
      const now = new Date();
      if (selectedDate <= now) {
        errors.scheduledDate = "Scheduled date must be in the future";
      }
    }

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
      const eventData = {
        name,
        venueId,
        scheduledDate,
        operatorId: operatorId || null,
      };
      await eventsAPI.create(eventData);
      navigate("/admin/events");
    } catch {
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/events")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        </div>

        {error && <ErrorMessage message={error} className="mb-6" />}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Enter the name for your cockfighting event (e.g., "Pelea de
                    Gallos - Viernes 6 Oct")
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter event name"
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Venue Selection */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Select the location where the cockfighting event will take
                    place
                  </div>
                </div>
              </div>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.venueId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              {formErrors.venueId && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.venueId}
                </p>
              )}
            </div>

            {/* Scheduled Date */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time *
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Select the date and time when the event will begin. Must be
                    in the future.
                  </div>
                </div>
              </div>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.scheduledDate
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.scheduledDate && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.scheduledDate}
                </p>
              )}
            </div>

            {/* Operator Selection */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator
                </label>
                <div className="relative group">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                    Select the operator who will manage this event. If left
                    blank, you will be assigned as the operator.
                  </div>
                </div>
              </div>
              <select
                value={operatorId || ""}
                onChange={(e) => setOperatorId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an operator (optional)</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {typeof operator.username === "string"
                      ? operator.username
                      : typeof operator === "object" && operator.username
                        ? operator.username
                        : "Unknown Operator"}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Select the operator who will manage this event. If left blank,
                you will be assigned as the operator.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/admin/events")}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
