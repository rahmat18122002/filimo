import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { attachDeviceHeader } from "./lib/deviceId";

// Identify this device to the backend before any request is made.
attachDeviceHeader();

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA install support (Chrome "Install app").
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silently ignore registration errors (e.g. unsupported environments)
    });
  });
}
