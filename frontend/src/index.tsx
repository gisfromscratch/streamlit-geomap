import React from "react"
import ReactDOM from "react-dom/client"
import GeomapComponent from "./GeomapComponent"

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
root.render(
  <React.StrictMode>
    <GeomapComponent />
  </React.StrictMode>
)