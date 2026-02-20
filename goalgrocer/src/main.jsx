import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { initializeDb } from "./services/db";
import "./styles/index.css";

async function bootstrap() {
  await initializeDb();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}

bootstrap();
