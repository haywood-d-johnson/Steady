import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
//import { getAllEntriesWithNotes, initDB, resetTables } from "./src/data/database";
import * as db from "./src/data/database";
import { seedDB } from "./src/data/seed";
//import "web-streams-polyfill/es6";

export default function App() {
    useEffect(() => {
        (async () => {
            console.log(db);
            await db.initDB();
            //await seedDB();
            await db.resetTables();
            const res = await db.getAllEntriesWithNotes();
            console.log("Seeded entries with notes: ", res);
        })();
    }, []);

    return (
        <View style={styles.container}>
            <Text>Open up App.tsx to start working on your app!</Text>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
});
