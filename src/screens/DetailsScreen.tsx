import React from "react";
import { View, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";

import { useDB } from "../data/DBContext";

type Props = NativeStackScreenProps<RootStackParamList, "Details">;

export default function DetailsScreen({ route }: Props) {
    return (
        <View>
            <Text>Details for item: {route.params.itemId}</Text>
        </View>
    );
}
