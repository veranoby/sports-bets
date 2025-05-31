/**
 * Venue Dashboard Component
 * Panel principal para administradores de galleras
 */
"use client";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const VenueDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Datos mock para galleras
  const mockVenues = [
    {
      id: "venue-1",
      name: "Gallera El Palenque",
      location: "Ciudad de México",
      eventsCount: 12,
      revenue: 12500,
      imageUrl: "/placeholder-venue.jpg",
    },
    {
      id: "venue-2",
      name: "Arena San Juan",
      location: "San Juan, PR",
      eventsCount: 8,
      revenue: 9800,
      imageUrl: "/placeholder-venue.jpg",
    },
  ];

  // Datos mock para eventos
  const mockEvents = [
    {
      id: "event-1",
      name: "Torneo Regional",
      date: "2023-11-15",
      time: "20:00",
      venue: "Gallera El Palenque",
    },
    {
      id: "event-2",
      name: "Campeonato Nacional",
      date: "2023-11-22",
      time: "19:30",
      venue: "Arena San Juan",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Sports<span className="text-green-600">Bets</span>
                <span className="ml-2 text-sm bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  Panel de Venue
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.username}</span>
              <button
                onClick={logout}
                className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Mis Galleras */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Mis Galleras</h2>
            <button
              onClick={() => console.log("Crear nueva gallera")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Crear nueva gallera
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="w-16 h-16 rounded-lg overflow-hidden mr-4">
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-gray-500">{venue.location}</p>
                    <div className="flex mt-2 text-sm">
                      <span className="text-gray-700 mr-4">
                        {venue.eventsCount} eventos
                      </span>
                      <span className="text-green-600">
                        ${venue.revenue.toLocaleString()} ingresos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Eventos Próximos */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Eventos en mis galleras
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gallera
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.venue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Estadísticas */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Eventos programados
              </h3>
              <p className="text-2xl font-bold text-green-600">15</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Ingresos totales
              </h3>
              <p className="text-2xl font-bold text-green-600">$32,450</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Apuestas promedio/evento
              </h3>
              <p className="text-2xl font-bold text-green-600">87</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VenueDashboard;
