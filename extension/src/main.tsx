import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import "./index.css";
import "react-tooltip/dist/react-tooltip.css";

ReactDOM.createRoot(
    document.getElementById("leetrooms-root") as HTMLElement
).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
