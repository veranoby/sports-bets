// frontend/src/pages/admin/CreateEvent.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { venuesAPI, usersAPI, eventsAPI } from "../../config/api";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import Card from "../../components/shared/Card";
import { ArrowLeft } from "lucide-react";

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const [venues, setVenues] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const venuesRes = await venuesAPI.getAll({
          status: "active",
          limit: 1000,
        });
        setVenues(venuesRes.data?.venues || []);
      } catch (_err) {
        setError("Failed to load necessary data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const errors: any = {};
    if (!name || name.length < 3 || name.length > 255) {
      errors.name = "Name must be between 3 and 255 characters.";
    }
    if (!venueId) {
      errors.venueId = "Please select a venue.";
    }
    if (!scheduledDate) {
      errors.scheduledDate = "Please select a date.";
    } else if (new Date(scheduledDate) < new Date()) {
      errors.scheduledDate = "Scheduled date must be in the future.";
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
    } catch (_err) {
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && venues.length === 0) {
    return <LoadingSpinner text="Loading creation form..." />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 ml-2">
          Create New Event
        </h1>
      </div>

      <Card className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Event Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${formErrors.name ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="venueId"
              className="block text-sm font-medium text-gray-700"
            >
              Venue
            </label>
            <select
              id="venueId"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${formErrors.venueId ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            >
              <option value="">Select a Venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            {formErrors.venueId && (
              <p className="text-xs text-red-500 mt-1">{formErrors.venueId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="scheduledDate"
              className="block text-sm font-medium text-gray-700"
            >
              Scheduled Date
            </label>
            <input
              type="datetime-local"
              id="scheduledDate"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${formErrors.scheduledDate ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {formErrors.scheduledDate && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.scheduledDate}
              </p>
            )}
          </div>

          {/* Operator selection removed */}

          {error && <ErrorMessage error={error} />}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner text="Creating..." /> : "Create Event"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateEvent;
