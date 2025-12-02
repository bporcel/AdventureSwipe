import React, { useState } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import TypeWriter from 'react-native-typewriter';
import useSwipe from '../hooks/useSwipe';

export default function SwipeableCard({ text, onSwipe, onPress }) {
    const { panGesture, animatedStyle } = useSwipe(onSwipe);
    const [isAllTextDisplayed, setIsAllTextDisplayed] = useState(false);

    function handlePress() {
        if (!isAllTextDisplayed) {
            onTypingEnd();
        }
    }

    function onTypingEnd() {
        setIsAllTextDisplayed(true);
        onPress();
    }

    return (
        <GestureDetector gesture={panGesture}>
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.card, animatedStyle]}>
                    {isAllTextDisplayed ? (
                        <Text style={styles.storyText}>{text}</Text>
                    ) : (
                        <TypeWriter
                            style={styles.storyText}
                            typing={1}
                            maxDelay={2}
                            onTypingEnd={onTypingEnd}
                        >
                            {text}
                        </TypeWriter>
                    )}
                </Animated.View>
            </Pressable>
        </GestureDetector>
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
        margin: 16,
        marginBottom: 16,
    },
});
