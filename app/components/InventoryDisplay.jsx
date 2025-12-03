import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function InventoryDisplay({ inventory }) {
    if (!inventory || inventory.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>INVENTORY</Text>
            <View style={styles.itemsContainer}>
                {inventory.map((item, index) => (
                    <View key={index} style={styles.itemTag}>
                        <Ionicons name="cube-outline" size={14} color="#BB86FC" />
                        <Text style={styles.itemText}>{item}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    title: {
        color: '#888',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    itemsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    itemTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(187, 134, 252, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(187, 134, 252, 0.2)',
        gap: 4,
    },
    itemText: {
        color: '#E1E1E1',
        fontSize: 12,
        fontWeight: '500',
    },
});
