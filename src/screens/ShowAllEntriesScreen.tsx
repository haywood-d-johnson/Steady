import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Button,
    RefreshControl,
    Alert,
    Platform,
    TouchableOpacity,
    Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useDB } from "../data/DBContext";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import type { ExportedData } from "../data/SteadyDBClass";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

type Props = NativeStackScreenProps<RootStackParamList, "ShowAllEntries">;

interface MoodEntry {
    id: number;
    score: number;
    created_at: string;
    note: string | null;
}

export default function ShowAllEntriesScreen({ navigation }: Props) {
    const { db } = useDB();
    const [entries, setEntries] = useState<MoodEntry[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadEntries = async () => {
        try {
            const data = await db.getAllEntriesWithNotes();
            setEntries(data);
        } catch (error) {
            console.error("Error loading entries:", error);
            Alert.alert("Error", "Failed to load entries");
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadEntries();
        setRefreshing(false);
    };

    const handleReset = async () => {
        // Use window.confirm for web, Alert for native
        const shouldReset =
            Platform.OS === "web"
                ? window.confirm("This will delete all entries. Are you sure?")
                : await new Promise(resolve => {
                      Alert.alert(
                          "Reset Database",
                          "This will delete all entries. Are you sure?",
                          [
                              {
                                  text: "Cancel",
                                  style: "cancel",
                                  onPress: () => resolve(false),
                              },
                              {
                                  text: "Reset",
                                  style: "destructive",
                                  onPress: () => resolve(true),
                              },
                          ]
                      );
                  });

        if (shouldReset) {
            setLoading(true);
            try {
                // Reset the database
                console.log("Resetting database...");
                await db.resetTables();
                console.log("Database reset completed");

                // Reinitialize the database (creates tables)
                console.log("Reinitializing database...");
                await db.initDB();
                console.log("Database reinitialized");

                // Load fresh state
                const freshEntries = await db.getAllEntriesWithNotes();
                setEntries(freshEntries);
                setLoading(false);

                // Show success message
                const message = "Database has been reset successfully";
                if (Platform.OS === "web") {
                    window.alert(message);
                } else {
                    Alert.alert("Success", message);
                }
            } catch (error) {
                setLoading(false);
                console.error("Error during reset process:", error);
                if (Platform.OS === "web") {
                    window.alert(
                        `Failed to reset database: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`
                    );
                } else {
                    Alert.alert(
                        "Error",
                        `Failed to reset database: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`
                    );
                }
            }
        }
    };

    const handleExport = async () => {
        try {
            const exportData = await db.exportData();
            const jsonString = JSON.stringify(exportData, null, 2);

            if (Platform.OS === "web") {
                // For web, create a download link using data URL
                const dataStr =
                    "data:text/json;charset=utf-8," +
                    encodeURIComponent(jsonString);
                const a = document.createElement("a");
                a.href = dataStr;
                a.download = `steady-export-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // No need for alert on web as the download will start automatically
            } else {
                // For mobile, create a temporary file and share it
                const fileUri = `${
                    FileSystem.documentDirectory
                }steady-export-${Date.now()}.json`;
                await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                    encoding: FileSystem.EncodingType.UTF8,
                });

                // For mobile, use sharing
                await Sharing.shareAsync(fileUri, {
                    mimeType: "application/json",
                    dialogTitle: "Export Steady Data",
                    UTI: "public.json",
                });

                // Clean up the temporary file
                await FileSystem.deleteAsync(fileUri, { idempotent: true });

                Alert.alert("Success", "Data has been exported successfully!");
            }
        } catch (error) {
            console.error("Export failed:", error);
            Alert.alert(
                "Export Failed",
                "Could not export data. Please try again."
            );
        }
    };

    const handleImport = async () => {
        try {
            let jsonData: ExportedData;

            if (Platform.OS === "web") {
                // For web, use file input
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/json";

                const file = await new Promise<File>((resolve, reject) => {
                    input.onchange = e => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files[0]) {
                            resolve(files[0]);
                        } else {
                            reject(new Error("No file selected"));
                        }
                    };
                    input.click();
                });

                const text = await file.text();
                jsonData = JSON.parse(text);
            } else {
                // For mobile, use document picker
                const result = await DocumentPicker.getDocumentAsync({
                    type: "application/json",
                });

                if (result.type === "cancel") {
                    return;
                }

                const fileContent = await FileSystem.readAsStringAsync(
                    result.uri
                );
                jsonData = JSON.parse(fileContent);
            }

            // Validate the data format
            if (
                !jsonData.version ||
                !jsonData.entries ||
                !Array.isArray(jsonData.entries)
            ) {
                Alert.alert(
                    "Invalid Format",
                    "The selected file is not in the correct format. Please make sure you're using a valid Steady export file."
                );
                return;
            }

            // Confirm import
            Alert.alert(
                "Confirm Import",
                `This will import ${jsonData.entries.length} entries and replace your current data. Continue?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Import",
                        onPress: async () => {
                            try {
                                await importData(jsonData);
                            } catch (error) {
                                console.error("Import failed:", error);
                                Alert.alert(
                                    "Import Failed",
                                    "Could not import the data. Please check the format and try again."
                                );
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error("Import failed:", error);
            Alert.alert(
                "Import Failed",
                "Could not read the selected file. Please make sure it's a valid Steady export file."
            );
        }
    };

    const importData = async (data: ExportedData) => {
        try {
            await db.importData(data);
            await loadEntries(); // Refresh the list
            Alert.alert("Success", "Data imported successfully!");
        } catch (error) {
            console.error("Import failed:", error);
            Alert.alert(
                "Import Failed",
                "Failed to import data. Please try again."
            );
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadEntries();
            setLoading(false);
        };
        init();
    }, []);

    const renderMoodEntry = ({ item }: { item: MoodEntry }) => (
        <TouchableOpacity
            style={styles.entryCard}
            onPress={() => navigation.navigate("Details", { entryId: item.id })}
        >
            <View style={styles.entryHeader}>
                <Text
                    style={[styles.score, { color: getScoreColor(item.score) }]}
                >
                    Score: {item.score}
                </Text>
                <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
            {item.note && (
                <Text style={styles.notePreview} numberOfLines={1}>
                    {item.note}
                </Text>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading database entries...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Mood History</Text>
                <Text style={styles.subtitle}>
                    Total Entries: {entries.length}
                </Text>
            </View>

            <FlatList
                data={entries}
                keyExtractor={item => `${item.id}`}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                renderItem={renderMoodEntry}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No entries found</Text>
                    </View>
                }
            />

            <View style={styles.footer}>
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={[styles.button, styles.exportButton]}
                        onPress={handleExport}
                    >
                        <Text style={styles.buttonText}>Export Data</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.importButton]}
                        onPress={handleImport}
                    >
                        <Text style={styles.buttonText}>Import Data</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.button, styles.resetButton]}
                    onPress={handleReset}
                >
                    <Text style={[styles.buttonText, styles.resetButtonText]}>
                        Reset Database
                    </Text>
                </TouchableOpacity>
            </View>
            <StatusBar style="auto" />
        </View>
    );
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
    },
    entryCard: {
        backgroundColor: "#fff",
        margin: 8,
        padding: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    entryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    score: {
        fontSize: 18,
        fontWeight: "bold",
    },
    date: {
        fontSize: 14,
        color: "#666",
    },
    notePreview: {
        fontSize: 14,
        color: "#666",
        fontStyle: "italic",
    },
    emptyState: {
        padding: 32,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        backgroundColor: "#fff",
    },
    buttonGroup: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        alignItems: "center",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    exportButton: {
        backgroundColor: "#4CAF50",
    },
    importButton: {
        backgroundColor: "#2196F3",
    },
    resetButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ff6b6b",
    },
    resetButtonText: {
        color: "#ff6b6b",
    },
});
