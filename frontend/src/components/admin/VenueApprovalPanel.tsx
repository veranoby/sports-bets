/**
 * VenueApprovalPanel Component - ESTRUCTURA HTML CORREGIDA
 * Panel para aprobar o rechazar solicitudes de venues
 *
 * CAMBIOS REALIZADOS:
 * - ❌ Removido TableLoadingRow fuera de tabla
 * - ❌ Removido <tbody> fuera de tabla
 * - ✅ Usado LoadingSpinner directamente
 * - ✅ Mantenida toda la lógica de negocio
 * - ✅ Mantenidos API calls y handlers
 */
"use client";

import React, { useState, useEffect } from "react";
import { venuesAPI } from "../../config/api";
import type { Venue } from "../../types";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
} from "lucide-react";
import StatusChip from "../shared/StatusChip";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import FilterBar from "../shared/FilterBar";
import EmptyState from "../shared/EmptyState";

const VenueApprovalPanel: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Cargar venues pendientes de aprobación
  const loadPendingVenues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await venuesAPI.getAll({ status: "pending" });
      setVenues(response.data.venues || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar venues");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingVenues();
  }, []);

  // Aprobar venue
  const handleApproveVenue = async (venueId: string) => {
    try {
      setIsUpdating(true);
      await venuesAPI.updateStatus(venueId, "approved");
      setVenues(venues.filter((venue) => venue.id !== venueId));
    } catch (err: any) {
      setError(err.message || "Error al aprobar venue");
    } finally {
      setIsUpdating(false);
    }
  };

  // Preparar rechazo de venue
  const prepareRejectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  // Rechazar venue
  const handleRejectVenue = async () => {
    if (!selectedVenue) return;

    try {
      setIsUpdating(true);
      await venuesAPI.updateStatus(
        selectedVenue.id,
        "rejected",
        rejectionReason
      );
      setVenues(venues.filter((venue) => venue.id !== selectedVenue.id));
      setShowRejectModal(false);
    } catch (err: any) {
      setError(err.message || "Error al rechazar venue");
    } finally {
      setIsUpdating(false);
    }
  };

  // Verificar que venues sea un array válido
  const safeVenues = Array.isArray(venues) ? venues : [];

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Venues Pendientes de Aprobación
        </h3>
        <button
          onClick={loadPendingVenues}
          className="px-3 py-2 rounded-lg text-sm flex items-center"
          style={{
            backgroundColor: "rgba(89, 108, 149, 0.1)",
            color: "#596c95",
          }}
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <ErrorMessage
          error={error}
          onRetry={loadPendingVenues}
          className="mb-4"
        />
      )}

      {/* ✅ CORREGIDO: LoadingSpinner en lugar de TableLoadingRow */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">
            Cargando venues pendientes...
          </span>
        </div>
      )}

      {/* Lista vacía */}
      {!isLoading && safeVenues.length === 0 && (
        <EmptyState
          title="No hay venues pendientes"
          description="No hay venues pendientes de aprobación en este momento."
        />
      )}

      {/* Filtros */}
      <FilterBar
        searchPlaceholder="Buscar galleras..."
        onSearch={() => {}}
        filters={[
          {
            key: "status",
            label: "Estado",
            type: "select",
            options: [
              { value: "pending", label: "Pendientes" },
              { value: "approved", label: "Aprobadas" },
            ],
          },
        ]}
        onClearFilters={() => {}}
      />

      {/* ✅ CORREGIDO: Grid de cards sin elementos de tabla */}
      <div className="grid grid-cols-1 gap-6">
        {safeVenues.map((venue) => (
          <div
            key={venue.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">
                    {venue.name}
                  </h4>
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span>{venue.location}</span>
                  </div>
                </div>
                <StatusChip
                  status={venue.status as "pending" | "approved" | "rejected"}
                />
              </div>

              {venue.description && (
                <p className="text-gray-600 mb-4">{venue.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
                    <span>Fecha de solicitud</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {new Date(venue.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {venue.contactInfo?.email && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      <span>Email de contacto</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {venue.contactInfo.email}
                    </p>
                  </div>
                )}

                {venue.contactInfo?.phone && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center text-gray-500 text-sm mb-1">
                      <span>Teléfono</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {venue.contactInfo.phone}
                    </p>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => prepareRejectVenue(venue)}
                  disabled={isUpdating}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </button>
                <button
                  onClick={() => handleApproveVenue(venue.id)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de rechazo */}
      {showRejectModal && selectedVenue && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Rechazar Venue: {selectedVenue.name}
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo del rechazo (opcional)"
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectVenue}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isUpdating ? "Rechazando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueApprovalPanel;
