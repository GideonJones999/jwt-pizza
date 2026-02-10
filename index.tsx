import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./src/app/app";

// Expose coverage data for Playwright tests
declare global {
  interface Window {
    __coverage__?: any;
  }
}

// Make sure coverage is accessible
if ((window as any).__coverage__) {
  console.log("Coverage enabled");
}

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
} else {
  console.error("No root element found");
}
