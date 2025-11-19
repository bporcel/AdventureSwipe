import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, withTiming, interpolate, Extrapolation, useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets'

const END_POSITION = 200;
const SCREEN_WIDTH = Dimensions.get('window').width;

const MAX_ROTATION = 10;
const MAX_VERTICAL_DIP = 20;

export default function useSwipe(onSwipe) {
    const onLeft = useSharedValue(true);
    const translateX = useSharedValue(0);
    const rotation = useSharedValue(0);
    const translateY = useSharedValue(0)

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            if (onLeft.value) {
                translateX.value = event.translationX;
            } else {
                translateX.value = END_POSITION + event.translationX;
            }

            rotation.value = interpolate(
                translateX.value,
                [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
                [-MAX_ROTATION, MAX_ROTATION],
                Extrapolation.CLAMP
            );

            translateY.value = interpolate(
                Math.abs(translateX.value),
                [0, 150],
                [0, MAX_VERTICAL_DIP],
                Extrapolation.CLAMP
            );
        })
        .onEnd((_) => {
            const swipeDirection = translateX.value > 100 ? 'right' : translateX.value < -100 ? 'left' : null;
            const finalX = swipeDirection === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;

            if (swipeDirection) {
                rotation.value = withTiming(swipeDirection === 'right' ? MAX_ROTATION * 2 : -MAX_ROTATION * 2, { duration: 250 });
                translateY.value = withTiming(0, { duration: 250 });
                translateX.value = withTiming(finalX, { duration: 250 }, () => {
                    scheduleOnRN(onSwipe, swipeDirection);
                });

            } else {
                translateX.value = withSpring(0);
                rotation.value = withSpring(0);
                translateY.value = withSpring(0);
            }

        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotateZ: `${rotation.value}deg` },
        ],
    }));

    return { panGesture, animatedStyle }

}