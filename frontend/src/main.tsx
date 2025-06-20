/* import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

*/

// frontend/src/main.tsx - DESHABILITAR STRICT MODE TEMPORALMENTE

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  // ❌ COMENTAR STRICT MODE TEMPORALMENTE PARA TESTING
  // <React.StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  // </React.StrictMode>
);

// ⚠️ NOTA: Esto es temporal para diagnosticar el problema.
// React Strict Mode causa double mounting en desarrollo.
// Una vez solucionado el listener thrashing, volver a habilitar.
