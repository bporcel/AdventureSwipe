import * as Sentry from '@sentry/react-native';
import { Stack } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AudioProvider } from "../common/AudioContext";

Sentry.init({
  enabled: __DEV__ ? false : true,
  dsn: 'https://f7d306951f7af1475916731ab818ae67@o4510473220718592.ingest.de.sentry.io/4510473222422608',
  sendDefaultPii: true,
  environment: __DEV__ ? 'development' : 'production',
});

export default Sentry.wrap(function RootLayout() {
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
});