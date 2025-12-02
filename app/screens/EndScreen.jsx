import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';


export default function StoryEndScreen({ history, onBackToMenu, onClose }) {
    const [fullHistory, setFullHistory] = useState(null);
    const [displayButtons, setDisplayButtons] = useState(true);

    useEffect(() => {
        let text = "";
        history.forEach((node) => {
            text += node.text + '\n';
        })

        setFullHistory(text);

    }, []);

    function handleTypingEnd() {
        setDisplayButtons(true);
    }

    return (
        <View style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>Story Completed!</Text>

                {fullHistory && (
                    // <TypeWriter
                    //     typing={1}
                    //     maxDelay={10}
                    //     style={styles.stat}
                    //     onTypingEnd={handleTypingEnd}
                    // >
                    //     {fullHistory}
                    // </TypeWriter>
                    <Text style={styles.stat}>
                        {fullHistory}
                    </Text>
                )}

                {displayButtons && (
                    <TouchableOpacity style={styles.button} onPress={onBackToMenu}>
                        <Text style={styles.buttonText}>Back to Menu</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#E1E1E1',
        marginBottom: 30,
        textShadowColor: "rgba(187, 134, 252, 0.5)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        textAlign: "center",
        letterSpacing: 1,
    },
    statsBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 40,
        width: '100%',
    },
    stat: {
        fontSize: 18,
        lineHeight: 28,
        color: '#ccc',
        marginBottom: 10,
        textAlign: "center",
    },
    button: {
        backgroundColor: '#1E1E1E',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#BB86FC",
        shadowColor: "#BB86FC",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: '#E1E1E1',
        fontSize: 18,
        fontWeight: '700',
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});
