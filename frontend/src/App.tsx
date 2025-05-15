import { useState } from "react";
import "./App.css";
import OperatorDashboard from "./pages/operator/Dashboard";
import UserDashboard from "./pages/user/Dashboard";

type DashboardType = "operator" | "user";

function App() {
  const [dashboardType, setDashboardType] = useState<DashboardType>("user");

  const toggleDashboard = (type: DashboardType) => {
    setDashboardType(type);
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

      {/* Dashboard content */}
      <div className="dashboard-content">
        {dashboardType === "operator" ? (
          <OperatorDashboard />
        ) : (
          <UserDashboard />
        )}
      </div>
    </div>
  );
}

export default App;
