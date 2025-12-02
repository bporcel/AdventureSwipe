import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import { generateNewGameNode, generateNextNode } from "../common/api";
import { clearAllImages } from "../common/imageStorage";
import { clearSave, loadSave, saveGame } from "../common/storage";
import SwipeableCard from './components/SwipeableCard';
import EndScreen from "./screens/EndScreen";
import HistoryScreen from "./screens/HistoryScreen";


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
    },
    depth: 0,
    isEnding: false
};

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [node, setNode] = useState(INITIAL_NODE);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showEnd, setShowEnd] = useState(false);
    const player = useAudioPlayer('https://musicfile.api.box/YzA3ZjcwYjgtNWRlNy00MTg4LWI4NjItYjY2ZTZiNGFiYjA1.mp3');

    const depth = useRef(0);

    useEffect(() => {
        player.seekTo(0);
        player.loop = true;
        player.play();
        (async () => {
            if (params.newGame) {
                onNewGame();
                return;
            }

            const saved = await loadSave();
            if (saved) {
                setNode(saved.node);
                setHistory(saved.history);
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
        await clearAllImages();
        setHistory([]);
        const newNode = await generateNewGameNode();
        setNode(newNode);
        depth.current = 0;
        setLoading(false);
    };

    const onExit = () => {
        router.replace("/");
    };

    async function handleChoice(choice) {
        if (node.isEnding) {
            // if (true) {
            player.replace('https://musicfile.api.box/NzI4MGZkODMtOWI2My00ZmM0LThiOTctNzFlMjMwNzE1YTg2.mp3')
            setShowEnd(true);
            return;
        }

        setLoading(true);
        setShowHints(false);
        depth.current++;

        try {
            const newNode = await generateNextNode({ currentNode: node, choice, history, depth: depth.current });
            setNode(newNode);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function onSwipeablePress() {
        setShowHints(true);
    }

    if (showHistory) {
        return <HistoryScreen history={history} onClose={() => setShowHistory(false)} />;
    }

    if (showEnd) {
        return <EndScreen onBackToMenu={onExit} onClose={onExit} history={history} />
    }

    return (
        <View style={styles.container}>
            <View style={styles.top}>
                <ImageBackground source={{ uri: node.image }} style={styles.image} resizeMode="cover" />
                <LinearGradient
                    colors={['transparent', '#121212']}
                    style={styles.gradient}
                />
            </View>

            <View style={styles.bottom}>
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 12 }} />
                ) : (
                    <ScrollView>
                        <SwipeableCard text={node.text} onSwipe={handleChoice} onPress={onSwipeablePress} />
                        {!node.isEnding && showHints &&
                            <View style={styles.hintRow}>
                                <View style={styles.hintBox}>
                                    <Text style={styles.hint}>{'\u276E'}</Text>
                                    <Text style={styles.hint}>{node.choices.left}</Text>
                                </View>
                                <View style={styles.hintBox}>
                                    <Text style={styles.hint}>{node.choices.right}</Text>
                                    <Text style={styles.hint}>{'\u276F'}</Text>
                                </View>
                            </View>
                        }
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
        backgroundColor: "#121212"
    },
    top: {
        height: TOP_IMAGE_HEIGHT
    },
    image: {
        flex: 1
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
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
        flex: 1,
        justifyContent: 'space-between',
        padding: 16,
        padding: 0
    },
    hintRow: {
        flexDirection: 'row',
        margin: 16,
        marginTop: 10,
    },
    hintBox: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'flex-start',
        paddingVertical: 8,
        marginHorizontal: 5,
    },
    hint: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    footerRow: {
        margin: 16,
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    smallLink: {
        color: "#BB86FC",
        fontSize: 16,
        fontWeight: "600"
    },
});
