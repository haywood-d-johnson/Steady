import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import DetailsScreen from "../screens/DetailsScreen";
import ShowAllEntriesScreen from "../screens/ShowAllEntriesScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { InfoScreen } from "../screens/InfoScreen";
import type { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
            <Stack.Screen
                name="ShowAllEntries"
                component={ShowAllEntriesScreen}
                options={{
                    title: "All Entries",
                }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: "Settings",
                }}
            />
            <Stack.Screen
                name="Info"
                component={InfoScreen}
                options={{
                    title: "Mood Scale Info",
                }}
            />
        </Stack.Navigator>
    );
}
