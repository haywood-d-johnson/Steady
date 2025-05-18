import * as SQLite from "expo-sqlite";

interface MoodEntry {
    id: number;
    score: number;
    created_at: string;
    note: string | null;
}

export class SteadyDB {
    db: SQLite.SQLiteDatabase;

    constructor() {
        this.db = SQLite.openDatabaseSync("steady.db");
    }

    async initDB() {
        await this.db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS mood_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score INTEGER,
            created_at TEXT
            `);
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER,
            note TEXT,
            FOREIGN KEY (entry_id) REFERENCES mood_entries(id)
            );
        `);
    }

    async getAllEntriesWithNotes() {
        const db = await SQLite.openDatabaseAsync("steady.db");

        const results = await db.getAllAsync<{
            id: number;
            score: number;
            created_at: string;
            note: string | "";
        }>(
            `SELECT e.id, e.score, e.created_at, n.note
            FROM mood_entries e
            LEFT JOIN notes n ON e.id = n.entry_id
            ORDER BY e.created_at DESC;`
        );

        return results;
    }

    async addMoodEntryWithNotes(score: number, notes: string[]) {
        const db = await SQLite.openDatabaseAsync("steady.db");

        const insertEntryStmt = await db.prepareAsync(
            "INSERT INTO mood_entries (score) VALUES (?) RETURNING id"
        );

        const insertNoteStmt = await db.prepareAsync(
            "INSERT INTO notes (entry_id, note) VALUES (?, ?)"
        );

        try {
            const entryRes = await insertEntryStmt.executeAsync<{ id: number }>(
                score
            );
            const entryId: number = entryRes.lastInsertRowId;
            console.log(entryId);

            for await (const note of notes) {
                await insertNoteStmt.executeAsync(entryId, note);
            }
        } finally {
            await insertEntryStmt.finalizeAsync();
            await insertNoteStmt.finalizeAsync();
        }
    }

    async getEntryById(id: number) {
        const db = await SQLite.openDatabaseAsync("steady.db");

        const results = await db.getAllAsync<{
            id: number;
            score: number;
            created_at: string;
            note: string | "";
        }>(
            `SELECT e.id, e.score, e.created_at, n.note
                FROM mood_entries e
                LEFT JOIN notes n ON e.id = n.entry_id
                WHERE e.id = ?
                ORDER BY e.created_at DESC;`,
            id
        );

        return results;
    }

    async resetTables() {
        const db = await SQLite.openDatabaseAsync("steady.db");

        await db.withTransactionAsync(async () => {
            await db.execAsync(`DROP TABLE IF EXISTS notes;`);
            await db.execAsync(`DROP TABLE IF EXISTS mood_entries;`);
        });

        console.log("Tables dropped.");
    }
}
