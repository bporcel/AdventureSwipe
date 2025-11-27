import React, { useRef, useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ImageBackground, Animated } from "react-native";
import { loadSave } from "../../common/storage";

export default function MainMenu({ onStart, onContinue }) {
  const [hasSave, setHasSave] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const save = await loadSave();
      setHasSave(!!save);
    })();
  }, []);

  const pressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  return (
    <ImageBackground
      source={require("../../assets/images/start-bg.jpg")}
      style={styles.bg}
      resizeMode="cover"
      imageStyle={{ opacity: 0.55 }}
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Text style={styles.title}>AdventureSwipe</Text>
        <Text style={styles.tagline}>Shape your fate with a single swipe</Text>

        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 20 }}>
          <Pressable
            onPress={onStart}
            onPressIn={pressIn}
            onPressOut={pressOut}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Start Adventure</Text>
          </Pressable>
        </Animated.View>

        {hasSave && (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              onPress={onContinue}
              onPressIn={pressIn}
              onPressOut={pressOut}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Load Game</Text>
            </Pressable>
          </Animated.View>
        )}
        <View style={styles.secondary}>
          <Text style={styles.link}>Settings</Text>
          <Text style={styles.link}>About</Text>
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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    backdropFilter: "blur(4px)",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondary: {
    marginTop: 40,
    alignItems: "center",
    gap: 12,
  },
  link: {
    color: "#ccc",
    fontSize: 16,
  },
});
