/**
 * Venue Dashboard Component
 * Panel principal para administradores de galleras
 */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useVenues, useEvents } from "../../hooks/useApi";
import StatCard from "../../components/shared/StatCard";
import PageContainer from "../../components/shared/PageContainer";
import Modal from "../../components/shared/Modal";
import { FormField } from "../../components/shared/FormField";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ErrorMessage from "../../components/shared/ErrorMessage";
import { venuesAPI, eventsAPI } from "../../config/api";
import DataCard from "../../components/shared/DataCard";
import type { Event } from "../../types";

const VenueDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { venues, loading: venuesLoading, error: venuesError } = useVenues();
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    getEventStats,
  } = useEvents();

  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [venueForm, setVenueForm] = useState<{
    name: string;
    location: string;
    description: string;
  }>({ name: "", location: "", description: "" });
  const [eventForm, setEventForm] = useState<{
    name: string;
    scheduledDate: string;
    venueId: string;
  }>({ name: "", scheduledDate: "", venueId: venues[0]?.id || "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [eventStats, setEventStats] = useState<Record<string, Partial<Event>>>(
    {}
  );
  const [eventStatsLoading, setEventStatsLoading] = useState(true);

  useEffect(() => {
    const fetchAllEventStats = async () => {
      setEventStatsLoading(true);
      const statsMap: Record<string, Partial<Event>> = {};
      if (events.length > 0) {
        for (const event of events) {
          try {
            const stats = await getEventStats(event.id);
            statsMap[event.id] = stats;
          } catch (error) {
            console.error(`Error fetching stats for event ${event.id}:`, error);
          }
        }
      }
      setEventStats(statsMap);
      setEventStatsLoading(false);
    };

    if (!eventsLoading && events) {
      fetchAllEventStats();
    }
  }, [events, eventsLoading, getEventStats]);

  if (venuesLoading || eventsLoading || eventStatsLoading) {
    return (
      <div className="p-8">
        <LoadingSpinner text="Cargando panel de Venue..." />
      </div>
    );
  }
  if (venuesError || eventsError) {
    return (
      <div className="p-8 text-red-600">
        <ErrorMessage
          error={venuesError || eventsError || "Error desconocido"}
        />
      </div>
    );
  }

  // Crear nueva gallera
  const handleCreateVenue = async () => {
    setFormLoading(true);
    setFormError(null);
    try {
      await venuesAPI.create(venueForm);
      setShowVenueModal(false);
      setVenueForm({ name: "", location: "", description: "" });
      // Reload page to refetch all data, including new venue and its events
      window.location.reload();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        setFormError((err as { message: string }).message);
      } else {
        setFormError("Error al crear gallera");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Crear nuevo evento
  const handleCreateEvent = async () => {
    setFormLoading(true);
    setFormError(null);
    try {
      await eventsAPI.create(eventForm);
      setShowEventModal(false);
      setEventForm({
        name: "",
        scheduledDate: "",
        venueId: venues[0]?.id || "",
      });
      // Reload page to refetch all data, including new event and its stats
      window.location.reload();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        setFormError((err as { message: string }).message);
      } else {
        setFormError("Error al crear evento");
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <PageContainer
      title={`SportsBets - Panel de Venue`}
      subtitle={user?.username}
      actions={
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm text-[#cd6263] hover:bg-[#cd6263]/10 rounded-lg"
        >
          Cerrar sesión
        </button>
      }
    >
      <div className="container mx-auto px-4 py-6">
        {/* Mis Galleras */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Mis Galleras</h2>
            <button
              onClick={() => setShowVenueModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Crear nueva gallera
            </button>
            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-2"
            >
              Crear evento
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venues.map((venue) => {
              const venueEvents = events.filter((e) => e.venueId === venue.id);
              const totalBets = venueEvents.reduce(
                (sum, e) =>
                  sum + (eventStats[e.id]?.totalBets || e.totalBets || 0),
                0
              );
              const totalPrize = venueEvents.reduce(
                (sum, e) =>
                  sum +
                  (eventStats[e.id]?.totalPrizePool || e.totalPrizePool || 0),
                0
              );
              return (
                <div
                  key={venue.id}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div className="w-16 h-16 rounded-lg overflow-hidden mr-4">
                      <img
                        src={venue.images?.[0] || "/placeholder-venue.jpg"}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {venue.name}
                      </h3>
                      <p className="text-sm text-gray-500">{venue.location}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <StatCard
                          title="Eventos"
                          value={venueEvents.length}
                          color="blue"
                        />
                        <StatCard
                          title="Apuestas totales"
                          value={totalBets.toLocaleString()}
                          color="red"
                        />
                        <StatCard
                          title="Premio acumulado"
                          value={`$${totalPrize.toLocaleString()}`}
                          color="green"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Eventos en mis galleras */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Eventos en mis galleras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const stats = eventStats[event.id] || event; // Usar stats detalladas si existen
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {event.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {venues.find((v) => v.id === event.venueId)?.name || "-"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <DataCard
                      title="Apuestas"
                      value={stats.totalBets?.toLocaleString() || 0}
                      color="red"
                    />
                    <DataCard
                      title="Premio"
                      value={`$${stats.totalPrizePool?.toLocaleString() || 0}`}
                      color="green"
                    />
                    <DataCard
                      title="Peleas"
                      value={stats.totalFights?.toLocaleString() || 0}
                      color="blue"
                    />
                    <DataCard
                      title="Completadas"
                      value={stats.completedFights?.toLocaleString() || 0}
                      color="gray"
                    />
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>
                      {new Date(event.scheduledDate).toLocaleDateString()}
                    </span>
                    <span>
                      {new Date(event.scheduledDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Estadísticas */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Eventos programados"
              value={events.length}
              change={{ value: 12, trend: "up", period: "este mes" }}
              color="blue"
            />
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Ingresos totales
              </h3>
              <p className="text-2xl font-bold text-green-600">$0</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Apuestas promedio/evento
              </h3>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Nueva Gallera */}
      {showVenueModal && (
        <Modal
          title="Crear Nueva Gallera"
          isOpen={showVenueModal}
          onClose={() => setShowVenueModal(false)}
        >
          <FormField
            label="Nombre"
            value={venueForm.name}
            onChange={(v: string | number) =>
              setVenueForm({ ...venueForm, name: String(v) })
            }
            required
          />
          <FormField
            label="Ubicación"
            value={venueForm.location}
            onChange={(v: string | number) =>
              setVenueForm({ ...venueForm, location: String(v) })
            }
            required
          />
          <FormField
            label="Descripción"
            type="textarea"
            value={venueForm.description}
            onChange={(v: string | number) =>
              setVenueForm({ ...venueForm, description: String(v) })
            }
          />
          {formError && <ErrorMessage error={formError} />}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowVenueModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
              disabled={formLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateVenue}
              className="px-4 py-2 bg-green-600 text-white rounded"
              disabled={formLoading}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : "Crear"}
            </button>
          </div>
        </Modal>
      )}
      {/* Modal Nuevo Evento */}
      {showEventModal && (
        <Modal
          title="Crear Nuevo Evento"
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
        >
          <FormField
            label="Nombre del Evento"
            value={eventForm.name}
            onChange={(v: string | number) =>
              setEventForm({ ...eventForm, name: String(v) })
            }
            required
          />
          <FormField
            label="Fecha y Hora"
            type="text"
            value={eventForm.scheduledDate}
            onChange={(v: string | number) =>
              setEventForm({ ...eventForm, scheduledDate: String(v) })
            }
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gallera
            </label>
            <select
              className="w-full border rounded-md p-2"
              value={eventForm.venueId}
              onChange={(e) =>
                setEventForm({ ...eventForm, venueId: e.target.value })
              }
              required
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          {formError && <ErrorMessage error={formError} />}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowEventModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
              disabled={formLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateEvent}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={formLoading}
            >
              {formLoading ? <LoadingSpinner size="sm" /> : "Crear"}
            </button>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
};

export default VenueDashboard;
