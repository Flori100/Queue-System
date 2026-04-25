import "./feature-cards.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FeatureCards } from "./FeatureCards.jsx";

const root = document.getElementById("feature-cards-root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <FeatureCards />
    </StrictMode>
  );
}
