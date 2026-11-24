import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/600.css";
import "./styles/global.css";
import './styles/identity.css';
import App from "./App.jsx";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
