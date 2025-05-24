export interface ISteadyDB {
    initDB(): Promise<void>;
    getAllEntriesWithNotes(): Promise<
        { id: number; score: number; created_at: string; note: string | null }[]
    >;
    addMoodEntryWithNotes(score: number, notes: string[]): Promise<void>;
    getEntryById(
        id: number
    ): Promise<
        { id: number; score: number; created_at: string; note: string | null }[]
    >;
    resetTables(): Promise<void>;
    deleteEntry(id: number): Promise<void>;
}
