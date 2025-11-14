import React, { useEffect, useState, useRef } from "react";
import { Text, TouchableWithoutFeedback, View } from "react-native";
import { sleep } from '../../common/utils'

export default function TypewriterText({ content, speed = 30, style }) {
    const [displayed, setDisplayed] = useState("");
    const isAnimatingRef = useRef(false);

    useEffect(() => {
        isAnimatingRef.current = false;
        setDisplayed("");
        animateText(content);
    }, [content]);

    async function animateText(text) {
        isAnimatingRef.current = true;
        let buffer = "";

        for (let i = 0; i < text.length; i++) {
            if (!isAnimatingRef.current) return;
            buffer += text[i];
            setDisplayed(buffer);
            await sleep(speed);
        }
    }

    const handlePress = () => {
        isAnimatingRef.current = false;
        setDisplayed(content);
    };

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <View>
                <Text style={style}>{displayed}</Text>
            </View>
        </TouchableWithoutFeedback>
    );
}