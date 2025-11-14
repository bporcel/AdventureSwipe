import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";

export default function HistoryScreen({ history, onClose }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Story History</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {history.map((node, index) => (
          <View key={index} style={styles.card}>
            <Image source={{ uri: node.image }} style={styles.image} resizeMode="cover" />
            <Text style={styles.text}>{node.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa", paddingTop: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  close: { fontSize: 16, color: "#0a84ff" },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { marginBottom: 16, backgroundColor: "#fff", borderRadius: 12, padding: 12, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6 },
  image: { width: "100%", height: 150, borderRadius: 8, marginBottom: 8 },
  text: { fontSize: 16, lineHeight: 22, color: "#222" },
});