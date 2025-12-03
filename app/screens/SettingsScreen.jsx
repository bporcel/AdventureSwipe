import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudio } from '../../common/AudioContext';
import { clearSave } from '../../common/storage';

export default function SettingsScreen() {
    const router = useRouter();
    const { isMuted, toggleMute } = useAudio();

    const handleReset = async () => {
        Alert.alert(
            "Reset Game Data",
            "Are you sure you want to delete your saved game? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await clearSave();
                        Alert.alert("Success", "Game data has been reset.");
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1E1E1E', '#121212']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#E1E1E1" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Audio</Text>
                        <View style={styles.row}>
                            <View style={styles.rowLabelContainer}>
                                <Ionicons name={isMuted ? "volume-mute-outline" : "volume-high-outline"} size={24} color="#BB86FC" />
                                <Text style={styles.rowLabel}>Mute Audio</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: "#BB86FC" }}
                                thumbColor={isMuted ? "#f4f3f4" : "#f4f3f4"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleMute}
                                value={isMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Data</Text>
                        <TouchableOpacity style={styles.row} onPress={handleReset}>
                            <View style={styles.rowLabelContainer}>
                                <Ionicons name="trash-outline" size={24} color="#CF6679" />
                                <Text style={[styles.rowLabel, { color: "#CF6679" }]}>Reset Game Data</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#E1E1E1',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#252525',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    rowLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowLabel: {
        fontSize: 16,
        color: '#E1E1E1',
        fontWeight: '500',
    },
});
