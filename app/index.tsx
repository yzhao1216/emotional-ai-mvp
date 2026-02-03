/**
 * Entry: render App into root.
 */

import "../styles/global.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<p>Error: root element not found.</p>";
} else {
  const root = createRoot(rootEl);
  root.render(<App />);
}
