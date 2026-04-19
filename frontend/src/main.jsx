import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- ENTRY POINT ---
// This file initializes the React application and mounts it to the DOM.
// We use React.StrictMode to highlight potential problems in an application,
// which is especially useful given our complex background ticking intervals.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Render the root App component which contains the entirety of the Kingdom Simulator state logic. */}
    <App />
  </React.StrictMode>,
)
