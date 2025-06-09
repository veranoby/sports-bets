/**
 * VenueApprovalPanel Component
 * Panel para aprobar o rechazar solicitudes de venues
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
  DollarSign,
  AlertCircle,
} from "lucide-react";

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
      setVenues(response.data);
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
      // Actualizar lista local
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
      // Actualizar lista local
      setVenues(venues.filter((venue) => venue.id !== selectedVenue.id));
      setShowRejectModal(false);
    } catch (err: any) {
      setError(err.message || "Error al rechazar venue");
    } finally {
      setIsUpdating(false);
    }
  };

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
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Cargando venues pendientes...</p>
        </div>
      )}

      {/* Lista de venues */}
      {!isLoading && venues.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-500">
            No hay venues pendientes de aprobación
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {venues.map((venue) => (
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pendiente
                </span>
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

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => prepareRejectVenue(venue)}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Rechazar
                </button>
                <button
                  onClick={() => handleApproveVenue(venue.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center bg-green-50 text-green-600 hover:bg-green-100"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Rechazar Venue
            </h3>
            <p className="text-gray-600 mb-4">
              Por favor, proporciona un motivo para el rechazo de{" "}
              <strong>{selectedVenue?.name}</strong>.
            </p>

            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Motivo del rechazo"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700"
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectVenue}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center bg-red-50 text-red-600 hover:bg-red-100"
                disabled={isUpdating || !rejectionReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueApprovalPanel;
