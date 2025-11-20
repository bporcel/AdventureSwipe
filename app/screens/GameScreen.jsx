import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView
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
        "https://placehold.co/400x400/png",
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
                    <ScrollView>
                        <SwipeableCard text={node.text} onSwipe={handleChoice} />
                        <View style={styles.hintRow}>
                            <View style={[styles.hintBox, { marginRight: 5 }]}>
                                <Text style={styles.hint}>{'\u276E'} {node.choices.left}</Text>
                            </View>
                            <View style={[styles.hintBox, { marginLeft: 5 }]}>
                                <Text style={styles.hint}>{node.choices.right} {'\u276F'}</Text>
                            </View>
                        </View>
                    </ScrollView>
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
    container: {
        flex: 1,
        backgroundColor: "#fafafa"
    },
    top: {
        height: TOP_IMAGE_HEIGHT
    },
    image: {
        flex: 1
    },
    topOverlay: {
        marginTop: 48,
        paddingHorizontal: 16
    },
    appTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        textShadowColor: "#0008",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
    },
    bottom: {
        flex: 2,
        justifyContent: 'space-between',
        padding: 16,
    },
    hintRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    hintBox: {
        flex: 1,
        padding: 20,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(68, 67, 71, 0.51)',
        backgroundColor: 'rgba(68, 67, 71, 0.08)',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hint: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    controls: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "space-between"
    },
    btn: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        minWidth: 110,
        alignItems: "center",
    },
    btnText: {
        fontWeight: "600"
    },
    footerRow: {
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    smallLink: {
        color: "#0a84ff"
    },
});