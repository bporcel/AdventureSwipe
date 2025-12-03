import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BackgroundImage = ({ uri, index, scrollY, layout }) => {
    const animatedStyle = useAnimatedStyle(() => {
        if (!layout) return { opacity: 0 };

        const itemY = layout.y;
        const itemHeight = layout.height;
        const itemCenter = itemY + itemHeight / 2;

        // Calculate opacity based on how close the text block is to the center of the screen
        // We use a broader range to ensure smooth transitions
        const opacity = interpolate(
            scrollY.value + SCREEN_HEIGHT / 2,
            [itemCenter - SCREEN_HEIGHT * 0.8, itemCenter, itemCenter + SCREEN_HEIGHT * 0.8],
            [0, 1, 0],
            Extrapolation.CLAMP
        );

        return {
            opacity,
        };
    });

    return (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
            <Animated.Image
                source={{ uri: uri || 'https://placehold.co/400x600/png' }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)', '#121212']}
                style={StyleSheet.absoluteFill}
            />
        </Animated.View>
    );
};

export default function StoryEndScreen({ history, onBackToMenu, onRestart, endingType = 'neutral' }) {
    const scrollY = useSharedValue(0);
    const [layouts, setLayouts] = useState({});

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const handleLayout = (index, event) => {
        const { y, height } = event.nativeEvent.layout;
        setLayouts((prev) => ({
            ...prev,
            [index]: { y, height },
        }));
    };

    return (
        <View style={styles.container}>
            {/* Background Layer */}
            <View style={StyleSheet.absoluteFill}>
                {history.map((node, index) => (
                    <BackgroundImage
                        key={`bg-${index}`}
                        uri={node.image}
                        index={index}
                        scrollY={scrollY}
                        layout={layouts[index]}
                    />
                ))}
            </View>

            {/* Content Layer */}
            <SafeAreaView style={styles.safeArea}>
                <Animated.ScrollView
                    contentContainerStyle={styles.scrollContent}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                >
                    <Text style={[styles.title, endingType === 'death' && styles.deathTitle]}>
                        {endingType === 'death' ? 'YOU DIED' : 'The End'}
                    </Text>

                    <View style={styles.storyWrapper}>
                        {history.map((node, index) => (
                            <View
                                key={`text-${index}`}
                                onLayout={(e) => handleLayout(index, e)}
                                style={styles.textBlock}
                            >
                                <Text style={styles.storyText}>{node.text}</Text>
                            </View>
                        ))}
                    </View>

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
                </Animated.ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 40,
        marginTop: 20,
        textAlign: "center",
        letterSpacing: 2,
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
        fontFamily: 'serif',
    },
    storyWrapper: {
        marginBottom: 40,
    },
    textBlock: {
        marginBottom: 32,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        marginTop: 20,
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
    deathTitle: {
        color: '#e74c3c',
        textShadowColor: "rgba(231, 76, 60, 0.5)",
    }
});
