import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { SteadyDB } from "./SteadyDBClass";

interface DBContextType {
    db: SteadyDB;
    error: Error | null;
}

const DBContext = createContext<DBContextType | null>(null);

export const useDB = () => {
    const context = useContext(DBContext);
    if (!context) throw new Error("useDB must be used inside a DBProvider");
    return context;
};

export const DBProvider = ({ children }: { children: ReactNode }) => {
    const [db, setDb] = useState<SteadyDB | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const initializeDB = async () => {
            try {
                const instance = new SteadyDB();
                await instance.initDB();
                setDb(instance);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to initialize database")
                );
            }
        };

        initializeDB();
    }, []);

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>
                    Database Error: {error.message}
                </Text>
            </View>
        );
    }

    if (!db) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#555" />
            </View>
        );
    }

    return (
        <DBContext.Provider value={{ db, error }}>
            {children}
        </DBContext.Provider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    errorText: {
        color: "red",
        textAlign: "center",
        padding: 20,
    },
});
