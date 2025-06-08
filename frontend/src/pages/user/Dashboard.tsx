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
import EventCard from "../../components/user/EventCard";
import BettingPanel from "../../components/user/BettingPanel";
import WalletSummary from "../../components/user/WalletSummary";
import Navigation from "../../components/user/Navigation";
import type {
  NavigationPage,
  BetSide,
  BetStatus,
  BetResult,
  Event,
} from "../../types";
import { useEvents, useBets } from "../../hooks/useApi";

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

  const { events, loading: eventsLoading } = useEvents();
  const { bets, loading: betsLoading } = useBets();

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
    <div className="user-dashboard">
      <Navigation currentPage="dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WalletSummary />
        <EventCard event={events[0]} />
        <BettingPanel fightId="current-fight-id" />
      </div>
    </div>
  );
};

export default Dashboard;
