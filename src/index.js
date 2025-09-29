import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CompanyGrid } from "./components/CompanyGrid";
import { CompanyDetail } from "./components/CompanyDetail";
import { AdminPanel } from "./components/AdminPanel";
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';

import "./styles.css";

const items = [
    {
      background: "#353535",
      Component: CompanyGrid
    }
];

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/company/:id" element={<CompanyDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<CompanyGrid />} />
        </Routes>
      </div>
    </Router>
  );
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

rootElement.style.background = items[0].background;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
