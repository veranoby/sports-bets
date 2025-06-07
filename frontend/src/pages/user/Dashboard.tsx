/**
 * Dashboard Component
 * Página principal para usuarios que muestra eventos en vivo, próximos, apuestas activas
 * y establecimientos destacados
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  ChevronRight,
  Trophy,
  Calendar,
  FlameIcon as Fire,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// Importación de componentes
import WalletSummary from "../../components/user/WalletSummary";
import EventCard from "../../components/user/EventCard";
import BetCard from "../../components/user/BetCard";
import type {
  NavigationPage,
  BetSide,
  BetStatus,
  BetResult,
} from "../../types";
import { useEvents } from "../../hooks/useApi";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState<NavigationPage>(
    () => (localStorage.getItem("activePage") as NavigationPage) || "home"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock de notificaciones
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      type: "new_bet",
      message: "Nueva apuesta disponible en Gallera El Palenque",
      read: false,
      timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
    },
    {
      id: "notif-2",
      type: "event_start",
      message: "Evento iniciado en Arena San Juan",
      read: false,
      timestamp: new Date(Date.now() - 7200000), // 2 horas atrás
    },
    {
      id: "notif-3",
      type: "bet_result",
      message: "Tu apuesta en Coliseo Nacional ha ganado!",
      read: true,
      timestamp: new Date(Date.now() - 86400000), // 1 día atrás
    },
  ]);

  const { events, loading, error } = useEvents();

  const filteredLiveEvents = events.filter(
    (event) => event.status === "in-progress"
  );

  const filteredUpcomingEvents = events.filter(
    (event) => event.status === "scheduled"
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // La búsqueda se aplica automáticamente al state searchTerm
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    // Marcar como leídas al abrir
    if (!showNotifications) {
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    }
  };

  useEffect(() => {
    localStorage.setItem("activePage", activePage);
  }, [activePage]);

  // Handlers para acciones
  const handleNavigate = (page: NavigationPage) => {
    setActivePage(page);
  };

  const handleViewWallet = () => {
    navigate("/user/Wallet");
  };

  const handleEnterEvent = (id: string) => {
    navigate(`/user/LiveEvent/${id}`);
  };

  const handleViewBetDetails = (id: string) => {
    console.log(`Ver detalles de apuesta: ${id}`);
    // Implementación futura: navegación a vista detallada de la apuesta
  };

  const handleViewAllEvents = () => {
    setActivePage("events");
  };

  const handleViewAllBets = () => {
    setActivePage("bets");
  };

  const handleViewPastEvents = () => {
    console.log("Ver eventos pasados");
    // Implementación futura: navegación a vista de eventos pasados
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Sports<span className="text-red-500">Bets</span>
              </h1>
              {user && (
                <span className="ml-4 text-gray-700">
                  Bienvenido, {user.username}!
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Barra de búsqueda */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Buscar eventos, galleras..."
                  className="w-40 sm:w-56 pl-3 pr-8 py-1.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Notificaciones */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-[#cd6263] text-white text-xs flex items-center justify-center rounded-full">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700">
                          Notificaciones
                          {unreadNotificationsCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {unreadNotificationsCount}
                            </span>
                          )}
                        </p>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">
                          No hay notificaciones
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? "bg-blue-50" : ""
                            }`}
                          >
                            <p className="text-sm text-gray-800">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(
                                notification.timestamp
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de logout */}
              <button
                onClick={logout}
                className="text-sm text-red-500 font-medium flex items-center"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Wallet Summary */}
          <div className="mt-4 mx-4">
            <WalletSummary
              balance={events[0]?.wallet?.balance || 0}
              frozenAmount={events[0]?.wallet?.frozenAmount || 0}
              className="bg-gradient-to-r from-[#1a1f37] to-[#2a325c] p-4 rounded-lg shadow-md"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 bg-[#1a1f37] text-white">
        {/* Live Events Section - Mostrado cuando hay eventos en vivo */}
        {filteredLiveEvents.length > 0 && (
          <section className="mb-8 bg-[#2a325c] p-4 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full mr-2 flex-shrink-0">
                <Fire className="w-4 h-4 text-red-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Eventos en Vivo
              </h2>
              <button
                onClick={handleViewAllEvents}
                className="ml-auto text-sm text-red-500 font-medium flex items-center !border-0"
                style={{ backgroundColor: "transparent" }}
              >
                Ver todos <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLiveEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  onEnter={handleEnterEvent}
                  statusChip={
                    event.status === "in-progress" ? (
                      <span className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#cd6263] text-white animate-pulse">
                        <Fire className="w-3 h-3 mr-1" />
                        EN VIVO
                      </span>
                    ) : (
                      <span className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#596c95] text-white">
                        <Calendar className="w-3 h-3 mr-1" />
                        PRÓXIMO
                      </span>
                    )
                  }
                />
              ))}
            </div>
          </section>
        )}

        {filteredLiveEvents.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            {searchTerm
              ? "No se encontraron eventos con ese nombre"
              : "No hay eventos en vivo"}
          </p>
        )}

        {/* Upcoming Events Section */}
        <section className="mb-8 bg-[#2a325c] p-4 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-2 flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-500" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Próximos Eventos
            </h2>
            <div className="ml-auto flex items-center space-x-4">
              <button
                onClick={handleViewPastEvents}
                className="text-sm text-gray-500 font-medium flex items-center hover:text-gray-700 !border-0"
                style={{ backgroundColor: "transparent" }}
              >
                Eventos pasados{" "}
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </button>
              <button
                onClick={handleViewAllEvents}
                className="text-sm text-red-500 font-medium flex items-center !border-0"
                style={{ backgroundColor: "transparent" }}
              >
                Ver todos <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUpcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onEnter={handleEnterEvent}
                statusChip={
                  event.status === "in-progress" ? (
                    <span className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#cd6263] text-white animate-pulse">
                      <Fire className="w-3 h-3 mr-1" />
                      EN VIVO
                    </span>
                  ) : (
                    <span className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#596c95] text-white">
                      <Calendar className="w-3 h-3 mr-1" />
                      PRÓXIMO
                    </span>
                  )
                }
              />
            ))}
          </div>
        </section>

        {/* Active Bets Section - Mostrado cuando hay apuestas activas */}
        {events.length > 0 && (
          <section className="mb-8 bg-[#2a325c] p-4 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-2 flex-shrink-0">
                <Trophy className="w-4 h-4 text-green-500" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Tus Apuestas</h2>
              <button
                onClick={handleViewAllBets}
                className="ml-auto text-sm text-red-500 font-medium flex items-center !border-0"
                style={{ backgroundColor: "transparent" }}
              >
                Ver todas <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((bet) => (
                <BetCard
                  key={bet.id}
                  id={bet.id}
                  amount={bet.amount}
                  potentialWin={bet.potentialWin}
                  side={bet.side}
                  venueName={bet.venueName}
                  fightNumber={bet.fightNumber}
                  status={bet.status}
                  result={bet.result}
                  onViewDetails={handleViewBetDetails}
                  statusColor={
                    bet.status === "active"
                      ? "bg-[#596c95]"
                      : bet.result === "win"
                      ? "bg-green-600"
                      : "bg-[#cd6263]"
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Venues Section */}
        <section className="mb-8 bg-[#2a325c] p-4 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mr-2 flex-shrink-0">
              <Trophy className="w-4 h-4 text-purple-500" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Galleras Destacadas
            </h2>
            <button
              className="ml-auto text-sm text-red-500 font-medium flex items-center !border-0"
              style={{ backgroundColor: "transparent" }}
            >
              Ver todas <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {events.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#596c95] transition-all hover:shadow-lg hover:border-[#cd6263]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={venue.imageUrl || "/placeholder.svg"}
                    alt={venue.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {venue.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {venue.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Loading/Error Global */}
      {/* {loading && <div className="w-full flex justify-center py-8"><Loader2 className="animate-spin" size={32} /></div>}
      {error && <div className="text-red-500 text-center">{error}</div>} */}
    </div>
  );
};

export default Dashboard;
