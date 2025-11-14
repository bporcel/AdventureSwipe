import React, { useRef, useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    Animated,
    PanResponder,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView
} from "react-native";
import { loadSave, saveGame, clearSave } from "../../common/storage";
import { generateNextNode } from "../../common/api";
import TypeWriterText from "../components/TypeWriterText"
import HistoryScreen from "./HistoryScreen"


const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const TOP_IMAGE_HEIGHT = SCREEN_H * 0.55;

const INITIAL_NODE = {
    id: "start",
    image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop",
    text:
        "You wake up in a mossy clearing beneath a ring of ancient oaks. To your right a narrow path disappears into fog; to your left, a ruined stone wall with strange runes.",
};

export default function GameScreen({ onExit }) {
    const pan = useRef(new Animated.ValueXY()).current;
    const [node, setNode] = useState(INITIAL_NODE); //Todo: initial node not sure
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const rotate = pan.x.interpolate({
        inputRange: [-SCREEN_W / 2, 0, SCREEN_W / 2],
        outputRange: ["-10deg", "0deg", "10deg"],
    });

    const cardStyle = { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] };

    useEffect(() => {
        (async () => {
            const saved = await loadSave();
            if (saved) {
                setNode(saved.node);
                setHistory(saved.history);
            }
            setReady(true);
        })();
    }, []);

    useEffect(() => {
        if (!ready) return;
        saveGame({ node, history });
    }, [node, history, ready]);

    useEffect(() => {
        setHistory((h) => [...h, node]);
    }, [node]);

    const resetPosition = () => {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    };

    const animateOff = (direction, onComplete) => {
        const toX = direction === "right" ? SCREEN_W * 1.2 : -SCREEN_W * 1.2;
        Animated.timing(pan, {
            toValue: { x: toX, y: 0 },
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            onComplete?.();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 120,
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: async (_, g) => {
                const { dx, vx } = g;
                if (dx > 120 || vx > 0.8) animateOff("right", () => handleChoice("right"));
                else if (dx < -120 || vx < -0.8) animateOff("left", () => handleChoice("left"));
                else resetPosition();
            },
        })
    ).current;

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

    const onUndo = () => {
        if (!history.length) return;
        const last = history[history.length - 1];
        setHistory((h) => h.slice(0, -1));
        setNode(last);
    };

    const onNewGame = async () => {
        await clearSave();
        setHistory([]);
        setNode(INITIAL_NODE);
    };

    if (!ready) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 12 }}>Loading...</Text>
            </View>
        );
    }

    if (showHistory) {
        return <HistoryScreen history={history} onClose={() => setShowHistory(false)} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.top}>
                <ImageBackground source={{ uri: node.image }} style={styles.image} resizeMode="cover">
                    <View style={styles.topOverlay}>
                        <Text style={styles.appTitle}>SwipeQuest</Text>
                    </View>
                </ImageBackground>
            </View>

            <View style={styles.bottom}>
                <Animated.View style={[styles.card, cardStyle]} {...panResponder.panHandlers}>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 12 }} />
                    ) : (
                        <ScrollView>
                            <TypeWriterText content={node.text} style={styles.storyText} speed={25} />
                            <View style={styles.hintRow}>
                                <Text style={styles.hint}>Swipe ← or →</Text>
                            </View>

                            <View style={styles.controls}>
                                <TouchableOpacity onPress={() => handleChoice("left")} style={[styles.btn, { backgroundColor: "#eee" }]}>
                                    <Text style={styles.btnText}>Left</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleChoice("right")} style={[styles.btn, { backgroundColor: "#222" }]}>
                                    <Text style={[styles.btnText, { color: "#fff" }]}>Right</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </Animated.View>

                <View style={styles.footerRow}>
                    <TouchableOpacity onPress={onUndo}>
                        <Text style={styles.smallLink}>Undo</Text>
                    </TouchableOpacity>
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
    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 18,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        minHeight: 200,
        maxHeight: 200
    },
    storyText: { fontSize: 18, lineHeight: 26, color: "#222" },
    hintRow: { marginTop: 12, flexDirection: "row", alignItems: "center" },
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
});