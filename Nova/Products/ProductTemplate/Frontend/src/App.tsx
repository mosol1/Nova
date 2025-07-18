import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  useEffect(() => {
    // Initialize Nova product connection
    initializeNovaConnection();
  }, []);

  async function initializeNovaConnection() {
    try {
      // TODO: Connect to your Nova backend service
      console.log("Initializing Nova product connection...");
    } catch (error) {
      console.error("Failed to connect to Nova backend:", error);
    }
  }

  return (
    <div className="container">
      <h1>Nova Product Template</h1>

      <div className="row">
        <div>
          <input
            id="greet-input"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button type="button" onClick={() => greet()}>
            Greet
          </button>
        </div>
      </div>

      <p>{greetMsg}</p>

      <div className="nova-info">
        <h3>Nova Product Template</h3>
        <p>This is a template for Nova products with React + Tauri frontend.</p>
        <p>Connected to Nova Core: <span className="status">✓</span></p>
      </div>
    </div>
  );
}

export default App; 