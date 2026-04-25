import "./globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BusinessDetailsPage } from "./BusinessDetailsPage.jsx";
import { getRouterBasename } from "./businessesData.js";

const el = document.getElementById("business-spa-root");
if (el) {
  el.removeAttribute("hidden");
  const basename = getRouterBasename();
  const routePath = basename ? "business/:id" : "/business/:id";
  createRoot(el).render(
    <StrictMode>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path={routePath} element={<BusinessDetailsPage />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
}
