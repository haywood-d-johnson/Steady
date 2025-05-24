import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    Switch,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useDB } from "../data/DBContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const NOTIFICATION_TIME_KEY = "notification_time";
const NOTIFICATIONS_ENABLED_KEY = "notifications_enabled";

export default function SettingsScreen({ navigation }: Props) {
    const { db } = useDB();
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [notificationTime, setNotificationTime] = useState(new Date());
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        loadNotificationSettings();
    }, []);

    const loadNotificationSettings = async () => {
        try {
            const timeStr = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
            const enabled = await AsyncStorage.getItem(
                NOTIFICATIONS_ENABLED_KEY
            );

            if (timeStr) {
                setNotificationTime(new Date(timeStr));
            }
            setNotificationsEnabled(enabled === "true");
        } catch (error) {
            console.error("Error loading notification settings:", error);
        }
    };

    const handleTimeChange = async (
        event: any,
        selectedTime: Date | undefined
    ) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const timeWithoutSeconds = new Date(selectedTime);
            timeWithoutSeconds.setSeconds(0);
            setNotificationTime(timeWithoutSeconds);
            await saveNotificationSettings(
                timeWithoutSeconds,
                notificationsEnabled
            );
        }
    };

    const toggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        await saveNotificationSettings(notificationTime, value);
    };

    const saveNotificationSettings = async (time: Date, enabled: boolean) => {
        try {
            await AsyncStorage.setItem(
                NOTIFICATION_TIME_KEY,
                time.toISOString()
            );
            await AsyncStorage.setItem(
                NOTIFICATIONS_ENABLED_KEY,
                enabled.toString()
            );

            if (enabled) {
                await scheduleNotification(time);
            } else {
                await Notifications.cancelAllScheduledNotificationsAsync();
            }
        } catch (error) {
            console.error("Error saving notification settings:", error);
            Alert.alert("Error", "Failed to save notification settings");
        }
    };

    const scheduleNotification = async (time: Date) => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            let finalStatus = status;

            if (status !== "granted") {
                const { status } =
                    await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                Alert.alert(
                    "Permission Required",
                    "Please enable notifications to receive reminders"
                );
                return;
            }

            await Notifications.cancelAllScheduledNotificationsAsync();

            const hours = time.getHours();
            const minutes = time.getMinutes();

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Mood Check-in Reminder",
                    body: "Don't forget to log your mood for today!",
                    sound: true,
                },
                trigger: {
                    hour: hours,
                    minute: minutes,
                    repeats: true,
                },
            });
        } catch (error) {
            console.error("Error scheduling notification:", error);
            Alert.alert("Error", "Failed to schedule notification");
        }
    };

    const formatTime = (date: Date) => {
        const dateWithoutSeconds = new Date(date);
        dateWithoutSeconds.setSeconds(0);

        return dateWithoutSeconds.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            second: undefined,
        });
    };

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
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Daily Reminder</Text>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={toggleNotifications}
                    />
                </View>
                {notificationsEnabled && (
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.timeButtonText}>
                            Reminder Time: {formatTime(notificationTime)}
                        </Text>
                    </TouchableOpacity>
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={notificationTime}
                        mode="time"
                        is24Hour={true}
                        onChange={handleTimeChange}
                    />
                )}
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
    settingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    settingLabel: {
        fontSize: 16,
        color: "#333",
    },
    timeButton: {
        backgroundColor: "#f5f5f5",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    timeButtonText: {
        fontSize: 16,
        color: "#333",
        textAlign: "center",
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
