// src/App.tsx
import { useState } from "react";
import "./App.css";
import OperatorDashboard from "./pages/operator/Dashboard";
import UserDashboard from "./pages/user/Dashboard";

function App() {
  const [userType, setUserType] = useState<"operator" | "user">("user");
  const isDevelopment = import.meta.env.DEV; // Mejor forma de verificar el entorno en Vite

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Development mode selector - will be removed in production */}
      {isDevelopment && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm p-3 flex justify-center">
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value as "operator" | "user")}
            className="px-4 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <option value="user">Modo Usuario</option>
            <option value="operator">Modo Operador</option>
          </select>
        </div>
      )}

      {/* Main content container with top padding for the selector */}
      <div className={isDevelopment ? "pt-16" : ""}>
        {userType === "operator" ? <OperatorDashboard /> : <UserDashboard />}
      </div>
    </div>
  );
}

export default App;
