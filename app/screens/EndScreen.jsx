import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import TypeWriter from 'react-native-typewriter';


export default function StoryEndScreen({ history, onBackToMenu, onRestart, backgroundImage }) {
    const [fullHistory, setFullHistory] = useState(null);
    const [displayButtons, setDisplayButtons] = useState(false);

    useEffect(() => {
        let text = "";
        history.forEach((node) => {
            text += node.text + '\n\n';
        })

        setFullHistory(text);

    }, []);

    function handleTypingEnd() {
        setDisplayButtons(true);
    }

    function handlePress() {
        if (!displayButtons) {
            handleTypingEnd();
        }
    }

    return (
        <ImageBackground
            source={{ uri: backgroundImage || 'https://placehold.co/400x600/png' }}
            style={styles.container}
            resizeMode="cover"
        >
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#121212']}
                style={styles.gradient}
            />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>The End</Text>

                    <Pressable style={styles.storyContainer} onPress={handlePress}>
                        {fullHistory && (
                            displayButtons ? (
                                <Text style={styles.storyText}>{fullHistory}</Text>
                            ) : (
                                <TypeWriter
                                    typing={1}
                                    maxDelay={10}
                                    style={styles.storyText}
                                    onTypingEnd={handleTypingEnd}
                                >
                                    {fullHistory}
                                </TypeWriter>
                            )
                        )}
                    </Pressable>

                    {displayButtons && (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.restartButton]} onPress={onRestart}>
                                <Ionicons name="refresh" size={24} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Restart Adventure</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.button]} onPress={onBackToMenu}>
                                <Ionicons name="grid-outline" size={24} color="#ccc" style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Back to Menu</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 30,
        marginTop: 20,
        textAlign: "center",
        letterSpacing: 2,
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
        fontFamily: 'serif',
    },
    storyContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 24,
        borderRadius: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minHeight: 500,
    },
    storyText: {
        fontSize: 18,
        lineHeight: 28,
        color: '#E0E0E0',
        textAlign: "left",
        fontFamily: 'serif',
    },
    buttonContainer: {
        gap: 16,
        alignItems: 'center',
    },
    button: {
        backgroundColor: "#1E1E1E",
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#BB86FC",
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        shadowColor: "#BB86FC",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    restartButton: {
        // Keeping the red accent for restart but using the new shape/shadow
        borderColor: "#e74c3c",
        shadowColor: "#e74c3c",
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: "#E1E1E1",
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    menuButtonText: {
        color: '#ccc',
        fontSize: 16,
    },
});
