import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAudio } from "../common/AudioContext";
import { loadSave } from "../common/storage";
import AudioControl from "./components/AudioControl";

export default function StartScreen() {
  const router = useRouter();
  const [hasSave, setHasSave] = useState(false);
  const startScaleAnim = useRef(new Animated.Value(1)).current;
  const loadScaleAnim = useRef(new Animated.Value(1)).current;
  const { play } = useAudio();
  const START_MUSIC = 'https://musicfile.api.box/MmQyYzNlYjAtZWRjMC00OTNiLWFlNjQtNmFiZDg5NTQyMTgy.mp3';

  useFocusEffect(
    useCallback(() => {
      play(START_MUSIC);
    }, [play])
  );

  useEffect(() => {
    (async () => {
      const save = await loadSave();
      setHasSave(!!save);
    })();
  }, []);

  const onStart = () => {
    router.push("/game?newGame=true");
  };

  const onContinue = () => {
    router.push("/game");
  };

  const pressIn = (anim) => {
    Animated.spring(anim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  const pressOut = (anim) => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  return (
    <ImageBackground
      source={require("../assets/images/index-bg.png")}
      style={styles.bg}
      resizeMode="cover"
      imageStyle={{ opacity: 0.75 }}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <AudioControl style={styles.audioControl} />
        <Text style={styles.title}>AdventureSwipe</Text>
        <Text style={styles.tagline}>Shape your fate with a single swipe</Text>
        <Animated.View style={{ transform: [{ scale: startScaleAnim }], marginBottom: 20 }}>
          <Pressable
            onPress={onStart}
            onPressIn={() => pressIn(startScaleAnim)}
            onPressOut={() => pressOut(startScaleAnim)}
            style={[styles.button, styles.startButton]}
          >
            <Text style={styles.buttonText}>Start Adventure</Text>
          </Pressable>
        </Animated.View>

        {hasSave && (
          <Animated.View style={{ transform: [{ scale: loadScaleAnim }] }}>
            <Pressable
              onPress={onContinue}
              onPressIn={() => pressIn(loadScaleAnim)}
              onPressOut={() => pressOut(loadScaleAnim)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Load Game</Text>
            </Pressable>
          </Animated.View>
        )}
        <View style={styles.secondary}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/screens/SettingsScreen")}>
            <Ionicons name="settings-outline" size={20} color="#E1E1E1" />
            <Text style={styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/screens/AboutScreen")}>
            <Ionicons name="information-circle-outline" size={20} color="#E1E1E1" />
            <Text style={styles.secondaryButtonText}>About</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)", // Darker overlay
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  audioControl: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 44,
    fontWeight: "800",
    color: "#E1E1E1",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(187, 134, 252, 0.5)", // Purple glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 18,
    color: "#BB86FC", // Secondary purple
    textAlign: "center",
    marginBottom: 50,
    fontStyle: "italic",
    opacity: 0.9,
  },
  button: {
    backgroundColor: "#1E1E1E",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BB86FC",
    alignItems: "center",
    shadowColor: "#BB86FC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButton: {
    borderColor: "#e74c3c",
    shadowColor: "#e74c3c",
  },
  buttonText: {
    color: "#E1E1E1",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  secondary: {
    marginTop: 40,
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#E1E1E1',
    fontSize: 16,
    fontWeight: '500',
  },
});