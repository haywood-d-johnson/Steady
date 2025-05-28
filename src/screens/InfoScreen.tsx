import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MoodInfo {
    value: number;
    moodDescription: string;
    hexColor: string;
    colorDescription: string;
}

const moodScale: MoodInfo[] = [
    {
        value: 0,
        moodDescription: "Extremely low",
        hexColor: "#001f3f",
        colorDescription: "Deep Navy (despair)",
    },
    {
        value: 1,
        moodDescription: "Very low",
        hexColor: "#003366",
        colorDescription: "Midnight Blue",
    },
    {
        value: 2,
        moodDescription: "Low",
        hexColor: "#004c99",
        colorDescription: "Dark Cerulean",
    },
    {
        value: 3,
        moodDescription: "Mildly low",
        hexColor: "#0066cc",
        colorDescription: "Blue (sad)",
    },
    {
        value: 4,
        moodDescription: "Neutral–low",
        hexColor: "#3399ff",
        colorDescription: "Sky Blue (calm)",
    },
    {
        value: 5,
        moodDescription: "Neutral/stable",
        hexColor: "#66cc99",
        colorDescription: "Mint (balance/peace)",
    },
    {
        value: 6,
        moodDescription: "Slightly elevated",
        hexColor: "#ccff66",
        colorDescription: "Soft Lime (optimism)",
    },
    {
        value: 7,
        moodDescription: "Mildly elevated",
        hexColor: "#ffff66",
        colorDescription: "Yellow (alert/energy)",
    },
    {
        value: 8,
        moodDescription: "High energy",
        hexColor: "#ffcc33",
        colorDescription: "Goldenrod (euphoria)",
    },
    {
        value: 9,
        moodDescription: "Very high",
        hexColor: "#ff9933",
        colorDescription: "Orange (agitation)",
    },
    {
        value: 10,
        moodDescription: "Extremely high",
        hexColor: "#ff3300",
        colorDescription: "Red-Orange (mania)",
    },
];

export const InfoScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>Mood Scale Reference</Text>
                <Text style={styles.subtitle}>
                    Understanding the mood values and their meanings
                </Text>

                {moodScale.map(mood => (
                    <View key={mood.value} style={styles.moodItem}>
                        <View
                            style={[
                                styles.colorBox,
                                { backgroundColor: mood.hexColor },
                            ]}
                        />
                        <View style={styles.moodInfo}>
                            <Text style={styles.value}>
                                Value: {mood.value}
                            </Text>
                            <Text style={styles.description}>
                                {mood.moodDescription}
                            </Text>
                            <Text style={styles.colorDescription}>
                                {mood.colorDescription}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#333",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 24,
    },
    moodItem: {
        flexDirection: "row",
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#f8f8f8",
        borderRadius: 8,
        alignItems: "center",
    },
    colorBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12,
    },
    moodInfo: {
        flex: 1,
    },
    value: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    description: {
        fontSize: 15,
        color: "#333",
        marginBottom: 2,
    },
    colorDescription: {
        fontSize: 14,
        color: "#666",
    },
});
