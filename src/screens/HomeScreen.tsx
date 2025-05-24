import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    PanResponder,
    Animated,
    Dimensions,
    TouchableOpacity,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useDB } from "../data/DBContext";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface CustomSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
    minimumValue?: number;
    maximumValue?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
    value,
    onValueChange,
    disabled = false,
    minimumValue = 0,
    maximumValue = 10,
    minimumTrackTintColor = "#000",
    maximumTrackTintColor = "#ddd",
    thumbTintColor = "#fff",
}) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const containerPadding = 30; // Padding on each side
    const sliderWidth =
        Dimensions.get("window").width - containerPadding * 2 - 28; // Subtract padding and thumb width
    const stepSize = sliderWidth / (maximumValue - minimumValue);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: 0,
                });
            },
            onPanResponderMove: (_, gesture) => {
                if (disabled) return;

                // Calculate the position relative to the container
                let newX = gesture.moveX - containerPadding;

                // Constrain the position within the track bounds
                newX = Math.max(0, Math.min(newX, sliderWidth));

                const newValue = Math.round(minimumValue + newX / stepSize);
                if (
                    newValue !== value &&
                    newValue >= minimumValue &&
                    newValue <= maximumValue
                ) {
                    onValueChange(newValue);
                }

                Animated.event([null, { dx: pan.x }], {
                    useNativeDriver: false,
                })(_, {
                    dx: newX - (pan.x as any)._value - (pan.x as any)._offset,
                });
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
            },
        })
    ).current;

    // Calculate position based on value, accounting for thumb width
    const position = (value - minimumValue) * stepSize;

    return (
        <View
            style={[
                styles.sliderContainer,
                { paddingHorizontal: containerPadding },
            ]}
        >
            <View
                style={[
                    styles.track,
                    { backgroundColor: maximumTrackTintColor },
                ]}
            >
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${
                                ((value - minimumValue) /
                                    (maximumValue - minimumValue)) *
                                100
                            }%`,
                            backgroundColor: minimumTrackTintColor,
                        },
                    ]}
                />
            </View>
            <Animated.View
                style={[
                    styles.thumb,
                    {
                        transform: [{ translateX: position }],
                        backgroundColor: thumbTintColor,
                    },
                ]}
                {...panResponder.panHandlers}
            />
        </View>
    );
};

// Function to get color based on score (0-10)
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

export default function HomeScreen({ navigation }: Props) {
    const { db } = useDB();
    const [selectedScore, setSelectedScore] = useState<number>(5);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("Settings")}
                    style={{ marginRight: 16 }}
                >
                    <Ionicons name="settings-outline" size={24} color="#333" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await db.addMoodEntryWithNotes(selectedScore, note ? [note] : []);

            // Reset form
            setSelectedScore(5); // Reset to neutral
            setNote("");

            // Show success message
            alert("Mood entry saved successfully!");

            // Navigate to all entries view
            navigation.navigate("ShowAllEntries");
        } catch (error) {
            console.error("Error saving mood entry:", error);
            alert("Failed to save mood entry. Please try again.");
        } finally {
            setIsSubmitting(false);
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

    const getIntensityDescription = (score: number) => {
        // Remove the intensity description since we now have more specific mood descriptions
        return "";
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            <StatusBar style="auto" />

            <Text style={styles.header}>How are you feeling?</Text>
            <Text style={styles.subheader}>5 = Baseline</Text>

            <View style={styles.sliderContainer}>
                <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Crisis</Text>
                    <Text style={styles.sliderLabel}>Mania</Text>
                </View>
                <CustomSlider
                    value={selectedScore}
                    onValueChange={setSelectedScore}
                    disabled={isSubmitting}
                    minimumValue={0}
                    maximumValue={10}
                    minimumTrackTintColor={getScoreColor(selectedScore)}
                    maximumTrackTintColor="#ddd"
                    thumbTintColor={getScoreColor(selectedScore)}
                />
            </View>

            <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>
                    Add a note (optional):
                    <Text
                        style={[
                            styles.scoreNumber,
                            { color: getScoreColor(selectedScore) },
                        ]}
                    >
                        {selectedScore}
                    </Text>
                </Text>
                <TextInput
                    style={styles.noteInput}
                    multiline
                    numberOfLines={4}
                    value={note}
                    onChangeText={setNote}
                    placeholder="How was your day? What made you feel this way? Any victories?"
                    placeholderTextColor="#999"
                    editable={!isSubmitting}
                />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        isSubmitting && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>Save Entry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.viewEntriesButton}
                    onPress={() => navigation.navigate("ShowAllEntries")}
                    disabled={isSubmitting}
                >
                    <Text style={styles.viewEntriesButtonText}>
                        View All Entries
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    contentContainer: {
        padding: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
        color: "#333",
    },
    subheader: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 30,
        color: "#666",
    },
    sliderContainer: {
        marginBottom: 20,
        width: "100%",
    },
    sliderLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    sliderLabel: {
        fontSize: 12,
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    track: {
        height: 6,
        borderRadius: 3,
        backgroundColor: "#ddd",
        width: "100%",
    },
    fill: {
        height: "100%",
        borderRadius: 3,
    },
    thumb: {
        position: "absolute",
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#fff",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        top: -11,
        marginLeft: -14, // Center the thumb by offsetting half its width
        transform: [{ translateY: -14 }], // Center vertically
    },
    scoreDisplay: {
        alignItems: "center",
        marginTop: 25,
        marginBottom: 30,
        backgroundColor: "#f5f5f5",
        padding: 15,
        borderRadius: 12,
        width: "100%",
    },
    scoreNumber: {
        fontSize: 32,
        fontWeight: "bold",
        marginLeft: 8,
    },
    moodDescription: {
        fontSize: 20,
        fontWeight: "600",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    noteContainer: {
        marginBottom: 30,
    },
    noteLabel: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: "#333",
    },
    noteInput: {
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        padding: 15,
        minHeight: 120,
        textAlignVertical: "top",
        fontSize: 16,
        color: "#333",
    },
    buttonContainer: {
        marginTop: 0,
    },
    submitButton: {
        backgroundColor: "#4CAF50",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 12,
    },
    submitButtonDisabled: {
        backgroundColor: "#ccc",
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    viewEntriesButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    viewEntriesButtonText: {
        color: "#666",
        fontSize: 16,
        fontWeight: "500",
    },
});
