import React, { useState } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StartScreen from "./screens/StartScreen";
import GameScreen from "./screens/GameScreen";
import { clearSave } from "../common/storage";

export default function App() {
  const [screen, setScreen] = useState("start");

  function renderScreen() {
    if (screen === 'game') {
      return <GameScreen onExit={() => setScreen("start")} />;
    }

    if (screen === 'start') {
      return <StartScreen
        onStart={async () => {
          await clearSave();
          setScreen("game");
        }}
        onContinue={() => setScreen("game")}
      />;
    }

    
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {renderScreen()}
    </GestureHandlerRootView>
  );
}