import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SteadyDB } from "./SteadyDBClass";

const DBContext = createContext<SteadyDB | null>(null);

export const useDB = () => {
    const context = useContext(DBContext);
    if (!context) throw new Error("useDB must be used inside a DBProvider");
    return context;
};

export const DBProvider = ({ children }: { children: ReactNode }) => {
    const [db, setDb] = useState<SteadyDB | null>(null);

    useEffect(() => {
        const initializeDB = async () => {
            const instance = new SteadyDB();
            await instance.initDB();
            setDb(instance);
        };

        initializeDB();
    }, []);

    if (!db) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#555" />
            </View>
        );
    }

    return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
});
