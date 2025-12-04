function buildTestResult() {
    return {
        id: `${Date.now()}`,
        text: `Lorem ipsum dolor sit amet, 
        consectetur adipiscing elit,
        laboris nisi ut aliquip ex ea commodo consequat. - ${Math.random()}`,
        image: "https://placehold.co/400x400/png",
        choices: {
            right: 'very very longo jejejejejejej right',
            left: 'same lmao lmoa lmao lmao lma left',
        },
        depth: 0,
        isEnding: false,
        endingType: "neutral",
        objectiveScore: 50,
        inventory: ["Rusty Sword", "Health Potion"]
    }
}

module.exports = {
    buildTestResult
};
