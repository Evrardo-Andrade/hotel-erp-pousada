import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App.jsx";
import { CompanyProvider } from "./app/company.jsx";
import { ThemeProvider } from "./app/theme.jsx";
import "./styles/global.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <CompanyProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CompanyProvider>
    </ThemeProvider>
  </React.StrictMode>
);
