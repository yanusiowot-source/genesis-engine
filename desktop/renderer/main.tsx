import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UniverseApp } from "@/components/universe-app";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Genesis Engine: missing root");

createRoot(root).render(
  <StrictMode>
    <UniverseApp />
  </StrictMode>,
);
