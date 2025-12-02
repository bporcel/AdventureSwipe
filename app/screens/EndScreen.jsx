import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import TypeWriter from 'react-native-typewriter'

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
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
    },
    statsBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 40,
        width: '100%',
    },
    stat: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 5,
    },
    button: {
        backgroundColor: '#3a3a3a',
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
