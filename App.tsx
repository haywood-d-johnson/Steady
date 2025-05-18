import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { DBProvider } from "./src/data/DBContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
    return (
        <DBProvider>
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>
        </DBProvider>
    );
}
