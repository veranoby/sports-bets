// src/App.tsx modificado
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import OperatorDashboard from "./pages/operator/Dashboard";

function App() {
  return (
    <div>
      <OperatorDashboard />
    </div>
  );
}

export default App;
