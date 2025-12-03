import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useAudio } from '../../common/AudioContext';

export default function AudioControl({ style, color = "#fff" }) {
    const { isMuted, toggleMute } = useAudio();

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={toggleMute}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={24}
                color={color}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
});
