import React from "react"
import { Router } from "./components/Router"
import "./style.css"

function IndexPopup() {
  return (
    <div style={{
      width: "400px",
      minHeight: "600px",
      fontFamily: "Arial, sans-serif",
      overflow: "hidden",
      backgroundColor: "#ffffff",
      color: "#1f2937"
    }}>
      <Router initialPath="/" />
    </div>
  )
}

export default IndexPopup