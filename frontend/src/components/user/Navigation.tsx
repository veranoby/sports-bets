/**
 * Navigation Component
 * Barra de navegación inferior fija con soporte para áreas seguras y optimización táctil
 */
"use client";

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Wallet, User } from "lucide-react";
import type { NavigationPage } from "../../types";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActivePage = (): NavigationPage => {
    if (location.pathname.startsWith("/events")) return "events";
    if (location.pathname.startsWith("/bets")) return "bets";
    if (location.pathname.startsWith("/wallet")) return "wallet";
    if (location.pathname.startsWith("/profile")) return "profile";
    return "home";
  };

  const handleNavigate = (page: NavigationPage) => {
    switch (page) {
      case "home":
        navigate("/dashboard");
        break;
      case "events":
        navigate("/events");
        break;
      case "bets":
        navigate("/bets");
        break;
      case "wallet":
        navigate("/wallet");
        break;
      case "profile":
        navigate("/profile");
        break;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
      <div className="flex justify-around items-center">
        <button
          onClick={() => handleNavigate("home")}
          className={`flex flex-col items-center p-2 ${
            getActivePage() === "home" ? "text-red-500" : "text-gray-500"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Inicio</span>
        </button>
        <button
          onClick={() => handleNavigate("events")}
          className={`flex flex-col items-center p-2 ${
            getActivePage() === "events" ? "text-red-500" : "text-gray-500"
          }`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-xs mt-1">Eventos</span>
        </button>
        <button
          onClick={() => handleNavigate("bets")}
          className={`flex flex-col items-center p-2 ${
            getActivePage() === "bets" ? "text-red-500" : "text-gray-500"
          }`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-xs mt-1">Mis Apuestas</span>
        </button>
        <button
          onClick={() => handleNavigate("wallet")}
          className={`flex flex-col items-center p-2 ${
            getActivePage() === "wallet" ? "text-red-500" : "text-gray-500"
          }`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-xs mt-1">Wallet</span>
        </button>
        <button
          onClick={() => handleNavigate("profile")}
          className={`flex flex-col items-center p-2 ${
            getActivePage() === "profile" ? "text-red-500" : "text-gray-500"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
