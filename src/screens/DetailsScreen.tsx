import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useDB } from "../data/DBContext";
import { StatusBar } from "expo-status-bar";

type Props = NativeStackScreenProps<RootStackParamList, "Details">;

interface MoodEntry {
    id: number;
    score: number;
    created_at: string;
    note: string | null;
}

const getScoreColor = (score: number) => {
    switch (score) {
        case 0:
            return "#001f3f"; // Deep Navy - Extremely low
        case 1:
            return "#003366"; // Midnight Blue - Very low
        case 2:
            return "#004c99"; // Dark Cerulean - Low
        case 3:
            return "#0066cc"; // Blue - Mildly low
        case 4:
            return "#3399ff"; // Sky Blue - Neutral-low
        case 5:
            return "#66cc99"; // Mint - Neutral/stable
        case 6:
            return "#ccff66"; // Soft Lime - Slightly elevated
        case 7:
            return "#ffff66"; // Yellow - Mildly elevated
        case 8:
            return "#ffcc33"; // Goldenrod - High energy
        case 9:
            return "#ff9933"; // Orange - Very high
        case 10:
            return "#ff3300"; // Red-Orange - Extremely high
        default:
            return "#66cc99"; // Default to neutral
    }
};

const getMoodDescription = (score: number) => {
    switch (score) {
        case 0:
            return "Extremely Low";
        case 1:
            return "Very Low";
        case 2:
            return "Low";
        case 3:
            return "Mildly Low";
        case 4:
            return "Neutral-Low";
        case 5:
            return "Stable";
        case 6:
            return "Slightly Elevated";
        case 7:
            return "Mildly Elevated";
        case 8:
            return "High Energy";
        case 9:
            return "Very High";
        case 10:
            return "Extremely High";
        default:
            return "Stable";
    }
};

export default function DetailsScreen({ route, navigation }: Props) {
    const { entryId } = route.params;
    const { db } = useDB();
    const [entry, setEntry] = useState<MoodEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEntry = async () => {
            try {
                const entries = await db.getEntryById(entryId);
                if (entries.length > 0) {
                    setEntry(entries[0]);
                }
            } catch (error) {
                console.error("Error loading entry:", error);
            } finally {
                setLoading(false);
            }
        };

        loadEntry();
    }, [entryId, db]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (!entry) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Entry not found</Text>
            </View>
        );
    }

    const scoreColor = getScoreColor(entry.score);

    return (
        <ScrollView style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.header}>
                <Text style={styles.date}>
                    {new Date(entry.created_at).toLocaleString()}
                </Text>
                <View
                    style={[
                        styles.scoreContainer,
                        { backgroundColor: scoreColor },
                    ]}
                >
                    <Text style={styles.scoreLabel}>Mood Level</Text>
                    <Text style={styles.score}>{entry.score}</Text>
                    <Text style={styles.moodDescription}>
                        {getMoodDescription(entry.score)}
                    </Text>
                </View>
            </View>

            <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Notes</Text>
                {entry.note ? (
                    <Text style={styles.noteText}>{entry.note}</Text>
                ) : (
                    <Text style={styles.emptyNote}>
                        No notes for this entry
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    header: {
        padding: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    date: {
        fontSize: 16,
        color: "#666",
        marginBottom: 16,
    },
    scoreContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
    },
    scoreLabel: {
        fontSize: 16,
        color: "#fff",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    score: {
        fontSize: 48,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    moodDescription: {
        fontSize: 16,
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: "500",
    },
    noteSection: {
        padding: 20,
    },
    noteLabel: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    noteText: {
        fontSize: 16,
        lineHeight: 24,
        color: "#333",
    },
    emptyNote: {
        fontSize: 16,
        color: "#666",
        fontStyle: "italic",
    },
    errorText: {
        fontSize: 16,
        color: "#ff4d4d",
        textAlign: "center",
        marginTop: 20,
    },
});
