export interface ISteadyDB {
    initDB(): Promise<void>;
    getAllEntriesWithNotes(): Promise<
        { id: number; score: number; created_at: string; note: string | "" }[]
    >;
    addMoodEntryWithNotes(score: number, notes: string[]): Promise<void>;
    getEntryById(
        id: number
    ): Promise<
        { id: number; score: number; created_at: string; note: string | "" }[]
    >;
    resetTables(): Promise<void>;
}
