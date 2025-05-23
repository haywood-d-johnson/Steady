import React, { createContext, useContext, useEffect, useState } from "react";
import { SteadyDB } from "./SteadyDBClass";

interface DBContextType {
    db: SteadyDB;
}

const DBContext = createContext<DBContextType | undefined>(undefined);

export function DBProvider({ children }: { children: React.ReactNode }) {
    const [instance] = useState(() => new SteadyDB());
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initDB = async () => {
            try {
                await instance.initDB();
                setIsInitialized(true);
            } catch (error) {
                console.error("Error initializing database:", error);
            }
        };

        initDB();
    }, [instance]);

    if (!isInitialized) {
        return null; // Or a loading spinner
    }

    return (
        <DBContext.Provider value={{ db: instance }}>
            {children}
        </DBContext.Provider>
    );
}

export function useDB() {
    const context = useContext(DBContext);
    if (context === undefined) {
        throw new Error("useDB must be used within a DBProvider");
    }
    return context;
}
