import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
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
        fontSize: 20,
        lineHeight: 30,
        color: "#E1E1E1",
        fontWeight: "400",
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: "#1E1E1E",
        borderRadius: 16,
        padding: 24,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        minHeight: 220,
        margin: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#333",
    },
});
