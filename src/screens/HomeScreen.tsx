import React from "react";
import { View, Text, Button } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
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
