import React, { useState } from "react";
import StartScreen from "./screens/StartScreen";
import GameScreen from "./screens/GameScreen";  
import { clearSave } from "../common/storage";          

export default function App() {
  const [screen, setScreen] = useState("start");

  if (screen === "game") {
    return <GameScreen onExit={() => setScreen("start")} />;
  }

  return (
    <StartScreen
      onStart={async () => {
        await clearSave();
        setScreen("game");
      }}
      onContinue={() => setScreen("game")}
    />
  );
}