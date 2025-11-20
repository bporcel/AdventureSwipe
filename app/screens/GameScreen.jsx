import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { loadSave, saveGame, clearSave } from "../../common/storage";
import { generateNextNode, generateNewGameNode } from "../../common/api";
import HistoryScreen from "./HistoryScreen"
import SwipeableCard from '../components/SwipeableCard'


const { height: SCREEN_H } = Dimensions.get("window");
const TOP_IMAGE_HEIGHT = SCREEN_H * 0.55;

const INITIAL_NODE = {
    id: "start",
    image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop",
    text:
        "You wake up in a mossy clearing beneath a ring of ancient oaks. To your right a narrow path disappears into fog; to your left, a ruined stone wall with strange runes.",
    choices: {
        right: "See were the path takes you",
        left: "Inspect the stone wall"
    }
};

export default function GameScreen({ onExit }) {
    const [node, setNode] = useState(INITIAL_NODE);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        (async () => {
            const saved = await loadSave();
            if (saved) {
                setNode(saved.node);
                setHistory(saved.history);
            } else {
                onNewGame();
            }
        })();
    }, []);

    useEffect(() => {
        saveGame({ node, history });
    }, [node, history]);

    useEffect(() => {
        setHistory((h) => [...h, node]);
    }, [node]);

    const onNewGame = async () => {
        setLoading(true);
        await clearSave();
        setHistory([]);
        const newNode = await generateNewGameNode();
        setNode(newNode);
        setLoading(false);
    };

    async function handleChoice(choice) {
        setLoading(true);
        try {
            const newNode = await generateNextNode({ currentNode: node, choice, history });
            setNode(newNode);
        } catch (err) {
            console.warn(err);
        } finally {
            setLoading(false);
        }
    }

    if (showHistory) {
        return <HistoryScreen history={history} onClose={() => setShowHistory(false)} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.top}>
                <ImageBackground source={{ uri: node.image }} style={styles.image} resizeMode="cover">
                </ImageBackground>
            </View>

            <View style={styles.bottom}>
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 12 }} />
                ) : (
                    <View>
                        <SwipeableCard text={node.text} onSwipe={handleChoice} />
                        <View style={styles.hintRow}>
                            <Text style={styles.hint}>{node.choices.left} ←</Text>
                            <Text style={styles.hint}>→ {node.choices.right}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.footerRow}>
                    <TouchableOpacity onPress={onNewGame}>
                        <Text style={[styles.smallLink, { color: "tomato" }]}>Restart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onExit}>
                        <Text style={[styles.smallLink, { color: "#999" }]}>Menu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowHistory(true)}>
                        <Text style={[styles.smallLink, { color: "purple" }]}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fafafa" },
    top: { height: TOP_IMAGE_HEIGHT },
    image: { flex: 1 },
    topOverlay: { marginTop: 48, paddingHorizontal: 16 },
    appTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        textShadowColor: "#0008",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
    },
    bottom: {
        flex: 1,
        padding: 16,
        justifyContent: "center"
    },
    hintRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        paddingHorizontal: 20,
    },
    hint: { fontSize: 13, color: "#666" },
    controls: { marginTop: 16, flexDirection: "row", justifyContent: "space-between" },
    btn: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        minWidth: 110,
        alignItems: "center",
    },
    btnText: { fontWeight: "600" },
    footerRow: {
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    smallLink: { color: "#0a84ff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    rightAction: { width: 50, height: 50, backgroundColor: 'purple' },
});