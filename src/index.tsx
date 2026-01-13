import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Could not find root element to mount to');

createRoot(rootElement).render(<App />);
  // Temporarily remove StrictMode if it still errors (see step #3)
  <StrictMode>
    <App />
  </StrictMode>
);
