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
import Navigation from "../../components/user/Navigation";
import type { NavigationPage } from "../../components/user/Navigation";
import WalletSummary from "../../components/user/WalletSummary";
import EventCard from "../../components/user/EventCard";
import BetCard from "../../components/user/BetCard";
import type {
  BetSide,
  BetStatus,
  BetResult,
} from "../../components/user/BetCard";

// Datos de ejemplo para el dashboard
const mockData = {
  wallet: {
    balance: 1250.75,
    frozenAmount: 350.0,
  },
  liveEvents: [
    {
      id: "event-1",
      venueName: "Gallera El Palenque",
      isLive: true,
      dateTime: new Date().toISOString(),
      activeBettors: 128,
      imageUrl: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "event-2",
      venueName: "Arena San Juan",
      isLive: true,
      dateTime: new Date().toISOString(),
      activeBettors: 95,
      imageUrl: "/placeholder.svg?height=200&width=400",
    },
  ],
  upcomingEvents: [
    {
      id: "event-3",
      venueName: "Coliseo Nacional",
      isLive: false,
      dateTime: new Date(Date.now() + 86400000).toISOString(), // Mañana
      activeBettors: 42,
      imageUrl: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "event-4",
      venueName: "Gallera La Victoria",
      isLive: false,
      dateTime: new Date(Date.now() + 172800000).toISOString(), // Pasado mañana
      activeBettors: 31,
      imageUrl: "/placeholder.svg?height=200&width=400",
    },
  ],
  activeBets: [
    {
      id: "bet-1",
      amount: 100,
      potentialWin: 190,
      side: "red" as BetSide,
      venueName: "Gallera El Palenque",
      fightNumber: 3,
      status: "active" as BetStatus,
    },
    {
      id: "bet-2",
      amount: 50,
      potentialWin: 95,
      side: "blue" as BetSide,
      venueName: "Arena San Juan",
      fightNumber: 5,
      status: "settled" as BetStatus,
      result: "win" as BetResult,
    },
    {
      id: "bet-3",
      amount: 75,
      potentialWin: 142.5,
      side: "red" as BetSide,
      venueName: "Coliseo Nacional",
      fightNumber: 2,
      status: "settled" as BetStatus,
      result: "loss" as BetResult,
    },
  ],
  featuredVenues: [
    {
      id: "venue-1",
      name: "Gallera El Palenque",
      location: "Ciudad de México",
      imageUrl: "/placeholder.svg?height=100&width=200",
    },
    {
      id: "venue-2",
      name: "Arena San Juan",
      location: "San Juan, PR",
      imageUrl: "/placeholder.svg?height=100&width=200",
    },
    {
      id: "venue-3",
      name: "Coliseo Nacional",
      location: "Bogotá, Colombia",
      imageUrl: "/placeholder.svg?height=100&width=200",
    },
  ],
  pastEvents: [
    {
      id: "event-5",
      venueName: "Gallera Imperial",
      isLive: false,
      dateTime: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
      activeBettors: 0,
      imageUrl: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "event-6",
      venueName: "Arena Central",
      isLive: false,
      dateTime: new Date(Date.now() - 86400000).toISOString(), // Ayer
      activeBettors: 0,
      imageUrl: "/placeholder.svg?height=200&width=400",
    },
  ],
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState<NavigationPage>(
    () => (localStorage.getItem("activePage") as NavigationPage) || "home"
  );
  // const [loading, setLoading] = useState(false); // Uncomment for async operations
  // const [error, setError] = useState<string | null>(null); // Uncomment for async operations

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
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors !border-0"
                aria-label="Buscar"
                style={{ backgroundColor: "transparent" }}
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative !border-0"
                aria-label="Notificaciones"
                style={{ backgroundColor: "transparent" }}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span
                  className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"
                  aria-hidden="true"
                ></span>
              </button>
              <button
                onClick={logout}
                className="text-sm text-red-500 font-medium flex items-center !border-0"
                style={{ backgroundColor: "transparent" }}
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Wallet Summary */}
          <div className="mt-4">
            <WalletSummary
              balance={mockData.wallet.balance}
              frozenAmount={mockData.wallet.frozenAmount}
              onViewWallet={handleViewWallet}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Live Events Section - Mostrado cuando hay eventos en vivo */}
        {mockData.liveEvents.length > 0 && (
          <section className="mb-8">
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
              {mockData.liveEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  venueName={event.venueName}
                  isLive={event.isLive}
                  dateTime={event.dateTime}
                  activeBettors={event.activeBettors}
                  imageUrl={event.imageUrl}
                  onEnter={handleEnterEvent}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events Section */}
        <section className="mb-8">
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
            {mockData.upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                venueName={event.venueName}
                isLive={event.isLive}
                dateTime={event.dateTime}
                activeBettors={event.activeBettors}
                imageUrl={event.imageUrl}
                onEnter={handleEnterEvent}
              />
            ))}
          </div>
        </section>

        {/* Active Bets Section - Mostrado cuando hay apuestas activas */}
        {mockData.activeBets.length > 0 && (
          <section className="mb-8">
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
              {mockData.activeBets.map((bet) => (
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
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Venues Section */}
        <section className="mb-8">
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
            {mockData.featuredVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={venue.imageUrl || "/placeholder.svg"}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
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

      {/* Navigation */}
      <Navigation activePage={activePage} onNavigate={handleNavigate} />

      {/* Loading/Error Global */}
      {/* {loading && <div className="w-full flex justify-center py-8"><Loader2 className="animate-spin" size={32} /></div>}
      {error && <div className="text-red-500 text-center">{error}</div>} */}
    </div>
  );
};

export default Dashboard;
