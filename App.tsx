import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { DBProvider } from "./DBContext";
import RootStack from "./navigation/RootStack";

export default function App() {
    return (
        <DBProvider>
            <NavigationContainer>
                <RootStack />
            </NavigationContainer>
        </DBProvider>
    );
}
