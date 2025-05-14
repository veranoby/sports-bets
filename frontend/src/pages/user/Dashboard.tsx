"use client";

import type React from "react";
import { useState } from "react";
import { Search, Bell, ExternalLink } from "lucide-react";

// Component imports
import EventCard from "../../components/user/EventCard";
import BetCard from "../../components/user/BetCard";
import WalletSummary from "../../components/user/WalletSummary";
import Navigation from "../../components/user/Navigation";

// Type definitions
type NavItem = "home" | "events" | "bets" | "profile";
type BetSide = "red" | "blue";
type BetStatus = "pending" | "active" | "settled" | "cancelled";
type BetResult = "win" | "loss" | "draw";

// Interface definitions
interface Event {
  id: string;
  venueName: string;
  isLive: boolean;
  dateTime: string;
  activeBettors: number;
  imageUrl: string;
}

interface Bet {
  id: string;
  amount: number;
  potentialWin: number;
  side: BetSide;
  venueName: string;
  fightNumber: number;
  status: BetStatus;
  result?: BetResult;
}

interface Venue {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
}

/**
 * Mock data for demonstration purposes
 */
// Live events mock data
const mockLiveEvents: Event[] = [
  {
    id: "live1",
    venueName: "Gallera Imperial",
    isLive: true,
    dateTime: "2023-05-15T14:30:00",
    activeBettors: 128,
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "live2",
    venueName: "Arena Nacional",
    isLive: true,
    dateTime: "2023-05-15T15:00:00",
    activeBettors: 95,
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
];

// Upcoming events mock data
const mockUpcomingEvents: Event[] = [
  {
    id: "upcoming1",
    venueName: "Coliseo del Gallo",
    isLive: false,
    dateTime: "Mañana, 2:00 PM",
    activeBettors: 42,
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "upcoming2",
    venueName: "Gallera El Campeón",
    isLive: false,
    dateTime: "Viernes, 6:30 PM",
    activeBettors: 67,
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "upcoming3",
    venueName: "Arena Central",
    isLive: false,
    dateTime: "Sábado, 1:00 PM",
    activeBettors: 89,
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
];

// Active bets mock data
const mockActiveBets: Bet[] = [
  {
    id: "bet1",
    amount: 50,
    potentialWin: 95,
    side: "red",
    venueName: "Gallera Imperial",
    fightNumber: 3,
    status: "active",
  },
  {
    id: "bet2",
    amount: 100,
    potentialWin: 190,
    side: "blue",
    venueName: "Arena Nacional",
    fightNumber: 5,
    status: "settled",
    result: "win",
  },
  {
    id: "bet3",
    amount: 75,
    potentialWin: 142.5,
    side: "red",
    venueName: "Coliseo del Gallo",
    fightNumber: 2,
    status: "pending",
  },
];

// Featured venues mock data
const mockFeaturedVenues: Venue[] = [
  {
    id: "venue1",
    name: "Gallera Imperial",
    location: "Ciudad de México",
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "venue2",
    name: "Arena Nacional",
    location: "Guadalajara",
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "venue3",
    name: "Coliseo del Gallo",
    location: "Monterrey",
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
];

/**
 * User Dashboard Component
 * Main entry point for the user application featuring:
 * - Events listing (live and upcoming)
 * - Active bets overview
 * - Featured venues
 * - Wallet summary
 * - Bottom navigation
 */
const Dashboard: React.FC = () => {
  // State for active navigation page
  const [activePage, setActivePage] = useState<NavItem>("home");

  /**
   * Event handlers
   */
  // Handle navigation changes
  const handleNavigate = (page: NavItem) => {
    setActivePage(page);
  };

  // Handle entering an event
  const handleEnterEvent = (id: string) => {
    console.log(`Entrando al evento: ${id}`);
    // Implementation would navigate to the event details page
  };

  // Handle viewing bet details
  const handleViewBetDetails = (id: string) => {
    console.log(`Viendo detalles de apuesta: ${id}`);
    // Implementation would open bet details view
  };

  // Handle viewing wallet details
  const handleViewWallet = () => {
    console.log("Viendo billetera completa");
    // Implementation would navigate to wallet page
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header with wallet summary */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          {/* Logo and action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-amber-600 dark:text-amber-500">
                Sports
                <span className="text-gray-800 dark:text-white">Bets</span>
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                aria-label="Buscar"
              >
                <Search
                  size={20}
                  className="text-gray-600 dark:text-gray-300"
                />
              </button>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 relative"
                aria-label="Notificaciones"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                <span
                  className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"
                  aria-hidden="true"
                ></span>
              </button>
            </div>
          </div>

          {/* Wallet summary */}
          <div className="mt-3">
            <WalletSummary
              balance={1250.75}
              frozenAmount={225.5}
              onViewWallet={handleViewWallet}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {/* Live events section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Eventos en vivo
            </h2>
            <button className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center">
              Ver todos
              <ExternalLink size={14} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockLiveEvents.length > 0 ? (
              mockLiveEvents.map((event) => (
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
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-4">
                No hay eventos en vivo en este momento
              </p>
            )}
          </div>
        </section>

        {/* Upcoming events section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Próximos eventos
            </h2>
            <button className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center">
              Ver todos
              <ExternalLink size={14} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockUpcomingEvents.map((event) => (
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

        {/* Active bets section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Tus apuestas
            </h2>
            <button className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center">
              Ver historial
              <ExternalLink size={14} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockActiveBets.length > 0 ? (
              mockActiveBets.map((bet) => (
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
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-4">
                No tienes apuestas activas
              </p>
            )}
          </div>
        </section>

        {/* Featured venues section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Galleras destacadas
            </h2>
            <button className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center">
              Ver todas
              <ExternalLink size={14} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mockFeaturedVenues.map((venue) => (
              <div
                key={venue.id}
                className="relative rounded-xl overflow-hidden shadow-md h-24 hover:shadow-lg transition-shadow"
              >
                <img
                  src={venue.imageUrl || "/placeholder.svg"}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-2 left-3 text-white">
                  <h3 className="font-bold text-sm">{venue.name}</h3>
                  <p className="text-xs opacity-80">{venue.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <Navigation activePage={activePage} onNavigate={handleNavigate} />
    </div>
  );
};

export default Dashboard;
