import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import * as db from "./src/data/database";
import { seedDB } from "./src/data/seed";

export default function App() {
    const [entries, setEntries] = useState<{
        id: number;
        score: number;
        created_at: string;
        note: string;
      }[]>([]);

    useEffect(() => {
        (async () => {
            await db.initDB();
            /* for dev */
            //await db.resetTables();
            //await seedDB();
            const res = await db.getAllEntriesWithNotes();
            //const res = await groupEntriesWithNotes(raw);
            console.log("Seeded entries with notes: ", res);
            setEntries(res);
        })();
    }, []);

    return (
        <View style={styles.container}>
            <FlatList
                data={entries}
                keyExtractor={(item, idx) => `${item.id}-${idx}`}
                renderItem={({ item }) => (
                    <View style={styles.entry}>
                        <Text>Score: {item.score}</Text>
                        <Text>Date: {item.created_at}</Text>
                        <Text>Note: {item.note === "" ? "no notes" : item.note}</Text>
                    </View>
                )}
            />
            <StatusBar style="auto" />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
    },
    entry: {
        padding: 12,
        marginBottom: 8,
        borderBottomColor: "#ccc",
        borderBottomWidth: 1,
    },
});
