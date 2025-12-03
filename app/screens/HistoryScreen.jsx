import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HistoryScreen({ history, onClose }) {
  return (
    <LinearGradient colors={["#1E1E1E", "#121212"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Past choices</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#E1E1E1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {history.map((node, index) => (
          <View key={index} style={styles.card}>
            <Image source={{ uri: node.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.textContainer}>
              <Text style={styles.text}>{node.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    position: "relative",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    marginBottom: 20,
    backgroundColor: "#252525",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  image: { width: "100%", height: 180 },
  textContainer: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#E0E0E0",
    fontFamily: "System", // Or a custom font if available
  },
});