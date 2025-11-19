import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { loadSave } from "../../common/storage";

export default function StartScreen({ onStart, onContinue }) {
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    (async () => {
      const save = await loadSave();
      setHasSave(!!save);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SwipeQuest</Text>
      <View style={{ marginTop: 40 }}>
        {hasSave && (
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={onContinue}>
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={onStart}>
          <Text style={styles.btnText}>New Adventure</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 36, fontWeight: "700", color: "#222" },
  btn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10, marginTop: 12 },
  primary: { backgroundColor: "#222" },
  secondary: { backgroundColor: "#0a84ff" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});