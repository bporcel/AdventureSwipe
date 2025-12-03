import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AudioProvider } from "../common/AudioContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AudioProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="game" options={{ headerShown: false }} />
          <Stack.Screen name="screens/SettingsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="screens/AboutScreen" options={{ headerShown: false }} />
        </Stack>
      </AudioProvider>
    </GestureHandlerRootView>
  );
}
