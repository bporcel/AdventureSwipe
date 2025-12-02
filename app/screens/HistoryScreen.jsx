import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#E1E1E1" },
  close: { fontSize: 16, color: "#BB86FC" },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { marginBottom: 16, backgroundColor: "#1E1E1E", borderRadius: 12, padding: 12, elevation: 4, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, borderWidth: 1, borderColor: "#333" },
  image: { width: "100%", height: 150, borderRadius: 8, marginBottom: 12 },
  text: { fontSize: 16, lineHeight: 24, color: "#ccc" },
});