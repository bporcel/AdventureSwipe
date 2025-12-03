import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export default function ObjectiveIndicator({ score = 50 }) {
    const progress = useSharedValue(score);

    useEffect(() => {
        progress.value = withSpring(score, { damping: 15, stiffness: 100 });
    }, [score]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value}%`,
            backgroundColor: progress.value < 30 ? '#CF6679' : progress.value > 70 ? '#03DAC6' : '#BB86FC',
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="skull-outline" size={16} color="#CF6679" />
            </View>
            <View style={styles.barContainer}>
                <Animated.View style={[styles.bar, animatedStyle]} />
            </View>
            <View style={styles.iconContainer}>
                <Ionicons name="trophy-outline" size={16} color="#03DAC6" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 10,
        width: '100%',
        justifyContent: 'center',
    },
    barContainer: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 3,
    },
    iconContainer: {
        width: 20,
        alignItems: 'center',
    },
});
