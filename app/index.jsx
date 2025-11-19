import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState } from "react";
import StartScreen from "./screens/StartScreen";
import GameScreen from "./screens/GameScreen";
import { clearSave } from "../common/storage";

export default function App() {
  const [screen, setScreen] = useState("start");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {screen === "game" ? (
        <GameScreen onExit={() => setScreen("start")} />
      ) : (
        <StartScreen
          onStart={async () => {
            await clearSave();
            setScreen("game");
          }}
          onContinue={() => setScreen("game")}
        />
      )}
    </GestureHandlerRootView>
  );
}