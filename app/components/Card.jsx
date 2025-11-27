import React, { useState } from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import TypeWriter from 'react-native-typewriter'

export default function Card({ text }) {
    const [isAllTextDisplayed, setIsAllTextDisplayed] = useState(false);

    const handlePress = () => {
        if (!isAllTextDisplayed) {
            setIsAllTextDisplayed(true);
        }
    }
    
    return (
        <Pressable onPress={handlePress}>
            <View style={[styles.card]}>
                {isAllTextDisplayed ? (
                    <Text style={styles.storyText}>{text}</Text>
                ) : (
                    <TypeWriter
                        style={styles.storyText}
                        typing={1}
                        maxDelay={2}
                        onTypingEnd={() => setIsAllTextDisplayed(true)}
                    >
                        {text}
                    </TypeWriter>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    storyText: {
        fontSize: 18,
        lineHeight: 26,
        color: "#222"
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 18,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        minHeight: 200,
        marginBottom: 16,
    },
});
