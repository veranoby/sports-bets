import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import OperatorDashboard from "./pages/operator/Dashboard";
import UserDashboard from "./pages/user/Dashboard";
import LiveEvent from "./pages/user/LiveEvent";
import Wallet from "./pages/user/Wallet";

type DashboardType = "operator" | "user";

function App() {
  const [dashboardType, setDashboardType] = useState<DashboardType>("user");
  const navigate = useNavigate();

  const toggleDashboard = (type: DashboardType) => {
    setDashboardType(type);
    if (type === "operator") {
      navigate("/operator");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="app-container">
      {/* Development mode selector */}
      {import.meta.env.DEV && (
        <div className="dashboard-selector p-4 bg-gray-100 border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4">
            <button
              onClick={() => toggleDashboard("user")}
              className={`px-4 py-2 rounded ${
                dashboardType === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              User Dashboard
            </button>
            <button
              onClick={() => toggleDashboard("operator")}
              className={`px-4 py-2 rounded ${
                dashboardType === "operator"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              Operator Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Dashboard content with routing */}
      <div className="dashboard-content">
        <Routes>
          {dashboardType === "operator" ? (
            <>
              <Route path="/operator" element={<OperatorDashboard />} />
              <Route path="*" element={<Navigate to="/operator" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<UserDashboard />} />
              <Route path="/live-event/:id" element={<LiveEvent />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}

export default App;
