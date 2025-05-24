import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useDB } from "../data/DBContext";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
    const { db } = useDB();

    const handleResetDatabase = async () => {
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
            try {
                await db.resetTables();
                await db.initDB();
                if (Platform.OS === "web") {
                    window.alert("Database has been reset successfully");
                } else {
                    Alert.alert(
                        "Success",
                        "Database has been reset successfully"
                    );
                }
                navigation.navigate("ShowAllEntries");
            } catch (error) {
                console.error("Error during reset:", error);
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                if (Platform.OS === "web") {
                    window.alert(`Failed to reset database: ${errorMessage}`);
                } else {
                    Alert.alert(
                        "Error",
                        `Failed to reset database: ${errorMessage}`
                    );
                }
            }
        }
    };

    return (
        <ScrollView style={styles.container}>
            <StatusBar style="auto" />
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate("ShowAllEntries")}
                >
                    <Text style={styles.buttonText}>View All Entries</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.dangerButton]}
                    onPress={handleResetDatabase}
                >
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>
                        Reset Database
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>Version: 1.0.0</Text>
                    <Text style={styles.infoText}>
                        Steady - Your Personal Mood Tracker
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

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
    },
    section: {
        backgroundColor: "#fff",
        marginTop: 16,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#e0e0e0",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
        color: "#333",
    },
    button: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        marginBottom: 8,
    },
    buttonText: {
        fontSize: 16,
        color: "#333",
        textAlign: "center",
    },
    dangerButton: {
        borderColor: "#ff4d4d",
    },
    dangerButtonText: {
        color: "#ff4d4d",
    },
    infoContainer: {
        padding: 8,
    },
    infoText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
});
