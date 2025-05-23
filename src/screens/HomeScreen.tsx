import React from "react";
import { View, Text, Button } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useDB } from "../data/DBContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
    const { db } = useDB();

    React.useEffect(() => {
        (async () => {
            const entries = await db.getAllEntriesWithNotes();
            console.log("Entries from DB: ", entries);
        })();
    }, [db]);

    return (
        <View>
            <Text>Home</Text>
            <Button
                title="Go to Details"
                onPress={() => navigation.navigate("Details", { itemId: 42 })}
            />
        </View>
    );
}
