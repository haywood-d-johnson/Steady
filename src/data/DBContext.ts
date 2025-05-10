import React, { createContext, useContext } from "react";
import type { ISteadyDB } from "./ISteadyDBClass";
import { SteadyDB } from "./SteadyDBClass";
const db = new SteadyDB();

const DBContext = createContext<ISteadyDB | null>(null);

export const useDB = () => {
    const context = useContext(DBContext);
    if (!context) throw new Error("useDB must be used inside a DBProvider");
    return context;
};

export const DBProvider = ({ children }: { children: React.ReactNode }) => (
    <DBContext.Provider value={db}>{children}</DBContext.Provider>
);
