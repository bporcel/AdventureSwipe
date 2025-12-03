import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateNewGameNode, generateNextNode } from "../common/api";
import { useAudio } from '../common/AudioContext';
import { clearAllImages } from "../common/imageStorage";
import { clearSave, loadSave, saveGame } from "../common/storage";
import AudioControl from './components/AudioControl';
import InventoryDisplay from './components/InventoryDisplay';
import LoadingRune from './components/LoadingRune';
import ObjectiveIndicator from './components/ObjectiveIndicator';
import SwipeableCard from './components/SwipeableCard';
import EndScreen from "./screens/EndScreen";
import HistoryScreen from "./screens/HistoryScreen";


const { height: SCREEN_H } = Dimensions.get("window");
const TOP_IMAGE_HEIGHT = SCREEN_H * 0.55;

const INITIAL_NODE = {
    id: "start",
    image:
        "",
    text:
        "",
    choices: {
        right: "",
        left: ""
    },
    depth: 0,
    isEnding: false,
    depth: 0,
    isEnding: false,
    objectiveScore: 50,
    inventory: []
};

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [node, setNode] = useState(INITIAL_NODE);
    const [prevImage, setPrevImage] = useState(null);
    const imageOpacity = useSharedValue(1);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showEnd, setShowEnd] = useState(false);
    const { play } = useAudio();
    const GAME_MUSIC = 'https://musicfile.api.box/YzA3ZjcwYjgtNWRlNy00MTg4LWI4NjItYjY2ZTZiNGFiYjA1.mp3';
    const END_MUSIC = 'https://musicfile.api.box/NzI4MGZkODMtOWI2My00ZmM0LThiOTctNzFlMjMwNzE1YTg2.mp3';


    const depth = useRef(0);

    useFocusEffect(
        useCallback(() => {
            play(GAME_MUSIC);
        }, [play])
    );

    useEffect(() => {
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
        setShowEnd(false);
        await clearSave();
        await clearAllImages();
        setHistory([]);
        const newNode = await generateNewGameNode();
        setPrevImage(null);
        setNode(newNode);
        depth.current = 0;
        setLoading(false);
    };

    const onExit = () => {
        router.replace("/");
    };

    async function handleChoice(choice) {
        if (node.isEnding) {
            play(END_MUSIC);
            setShowEnd(true);
            return;
        }

        setLoading(true);
        setShowHints(false);
        depth.current++;

        try {
            const newNode = await generateNextNode({ currentNode: node, choice, history, depth: depth.current });
            setPrevImage(node.image);
            setNode(newNode);
            imageOpacity.value = 0;
            imageOpacity.value = withTiming(1, { duration: 1000 });
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
        return <EndScreen onBackToMenu={onExit} onClose={onExit} history={history} backgroundImage={node.image} onRestart={onNewGame} endingType={node.endingType} />
    }

    return (
        <View style={styles.container}>
            <View style={styles.top}>
                {prevImage && (
                    <ImageBackground source={{ uri: prevImage }} style={[styles.image, StyleSheet.absoluteFill]} resizeMode="cover" />
                )}
                <Animated.View style={[styles.image, { opacity: imageOpacity }]}>
                    <ImageBackground source={{ uri: node.image }} style={styles.image} resizeMode="cover" />
                </Animated.View>
                <LinearGradient
                    colors={['transparent', '#121212']}
                    style={styles.gradient}
                />
                <AudioControl style={styles.muteButton} />
            </View>

            <View style={styles.bottom}>
                <ObjectiveIndicator score={node.objectiveScore} />
                <InventoryDisplay inventory={node.inventory} />
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <LoadingRune />
                    </View>
                ) : (
                    <ScrollView>
                        <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)}>
                            <SwipeableCard text={node.text} onSwipe={handleChoice} onPress={onSwipeablePress} />
                        </Animated.View>
                        {!node.isEnding && showHints &&
                            <View style={styles.hintContainer}>
                                <TouchableOpacity style={[styles.hintCard, styles.hintCardLeft]} onPress={() => handleChoice('left')}>
                                    <Ionicons name="arrow-back" size={20} color="#BB86FC" />
                                    <Text style={styles.hintText}>{node.choices.left}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.hintCard, styles.hintCardRight]} onPress={() => handleChoice('right')}>
                                    <Text style={[styles.hintText, styles.hintTextRight]}>{node.choices.right}</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#BB86FC" />
                                </TouchableOpacity>
                            </View>
                        }
                        {node.isEnding && (
                            <View style={styles.endingHintContainer}>
                                <TouchableOpacity style={[styles.hintCard, styles.hintCardCenter]} onPress={() => handleChoice('right')}>
                                    <Text style={styles.hintText}>Swipe to continue...</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#BB86FC" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                )}

                <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.footerButton} onPress={onNewGame}>
                            <Ionicons name="refresh-circle-outline" size={28} color="tomato" />
                            <Text style={[styles.footerLabel, { color: "tomato" }]}>Restart</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.footerButton} onPress={onExit}>
                            <Ionicons name="grid-outline" size={24} color="#999" />
                            <Text style={[styles.footerLabel, { color: "#999" }]}>Menu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.footerButton} onPress={() => setShowHistory(true)}>
                            <Ionicons name="time-outline" size={24} color="#BB86FC" />
                            <Text style={[styles.footerLabel, { color: "#BB86FC" }]}>History</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
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
        height: TOP_IMAGE_HEIGHT,
        position: 'relative',
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
    muteButton: {
        position: 'absolute',
        top: 50, // Adjust based on safe area if needed, or use SafeAreaView
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
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
    hintContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 32,
        gap: 12,
    },
    hintCard: {
        flex: 1,
        backgroundColor: '#252525',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 0,
    },
    hintCardLeft: {
        justifyContent: 'flex-start',
    },
    hintCardRight: {
        justifyContent: 'flex-end',
    },
    hintCardCenter: {
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    hintText: {
        fontSize: 14,
        color: '#E1E1E1',
        fontWeight: '500',
        flex: 1,
        marginLeft: 8,
        lineHeight: 20,
        flexShrink: 1,
    },
    hintTextRight: {
        textAlign: 'right',
        marginRight: 8,
        marginLeft: 0,
    },
    footerContainer: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 12,
    },
    footerButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    footerLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 4,
    },
    endingHintContainer: {
        paddingHorizontal: 16,
    },
});
