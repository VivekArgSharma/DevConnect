// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { UnreadProvider } from "./contexts/UnreadContext"; // ✅ ADD THIS

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      {/* ✅ UNREAD MESSAGES PROVIDER */}
      <UnreadProvider>
        <App />
      </UnreadProvider>
    </AuthProvider>
  </React.StrictMode>
);
