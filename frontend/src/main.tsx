// frontend/src/main.tsx - DESHABILITAR STRICTMODE TEMPORALMENTE
// ====================================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// 🚨 STRICTMODE DESHABILITADO PARA ELIMINAR DOUBLE MOUNTING
// En desarrollo, StrictMode causa que componentes se monten 2 veces
// esto crea listener thrashing artificial que no existe en producción

root.render(
  // <React.StrictMode>  // ← COMENTADO TEMPORALMENTE
  <BrowserRouter>
    <App />
  </BrowserRouter>
  // </React.StrictMode>
);

// 📝 NOTA: Re-habilitar StrictMode después de optimizar WebSocket
// root.render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </React.StrictMode>
// );
