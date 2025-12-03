import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
    const router = useRouter();

    const handlePrivacyPolicy = () => {
        Linking.openURL('https://bporcel.notion.site/Adventure-Swipe-Legal-2be8856a4cde803aa2c7ecc4f74edbce');
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
                    <Text style={styles.title}>About</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="compass-outline" size={80} color="#BB86FC" />
                        <Text style={styles.appName}>AdventureSwipe</Text>
                        <Text style={styles.version}>Version 1.0.0</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.text}>
                            AdventureSwipe is an AI-powered choose-your-own-adventure game.
                            Every choice you make shapes the story, generating unique narratives and visuals on the fly.
                            Will you survive the dark fantasy world?
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Credits</Text>
                        <View style={styles.creditRow}>
                            <Text style={styles.creditLabel}>Developed by</Text>
                            <Text style={styles.creditValue}>AdventureSwipe Team</Text>
                        </View>
                        <View style={styles.creditRow}>
                            <Text style={styles.creditLabel}>Story AI</Text>
                            <Text style={styles.creditValue}>OpenAI GPT-4o-mini</Text>
                        </View>
                        <View style={styles.creditRow}>
                            <Text style={styles.creditLabel}>Visuals AI</Text>
                            <Text style={styles.creditValue}>Google Gemini Flash</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Legal</Text>
                        <TouchableOpacity style={styles.row} onPress={handlePrivacyPolicy}>
                            <View style={styles.rowLabelContainer}>
                                <Ionicons name="document-text-outline" size={24} color="#E1E1E1" />
                                <Text style={styles.rowLabel}>Privacy Policy & Terms of Service</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© 2025 AdventureSwipe</Text>
                    </View>
                </ScrollView>
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
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#E1E1E1',
        marginTop: 16,
        letterSpacing: 1,
    },
    version: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
    },
    section: {
        marginBottom: 32,
        backgroundColor: '#252525',
        padding: 20,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#BB86FC',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    text: {
        fontSize: 16,
        color: '#E1E1E1',
        lineHeight: 24,
    },
    creditRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    creditLabel: {
        fontSize: 16,
        color: '#aaa',
    },
    creditValue: {
        fontSize: 16,
        color: '#E1E1E1',
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#666',
        fontSize: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
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
