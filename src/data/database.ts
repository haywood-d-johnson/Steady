import * as SQLite from "expo-sqlite";

import { seedDB } from "./seed";

export const initDB = async () => {
    const db = await SQLite.openDatabaseAsync("steady.db");

    await db.withTransactionAsync(async () => {
        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mood_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        score INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
        );
        PRAGMA journal_mode = 'wal';
    `);

        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (entry_id) REFERENCES mood_entries(id) ON DELETE CASCADE
        );
        PRAGMA journal_mode = 'wal';
    `);
    });
};

export const addMoodEntryWithNotes = async (score: number, notes: string[]) => {
    const db = await SQLite.openDatabaseAsync("steady.db");

    const insertEntryStmt = await db.prepareAsync(
        "INSERT INTO mood_entries (score) VALUES (?) RETURNING id"
    );

    const insertNoteStmt = await db.prepareAsync(
        "INSERT INTO notes (entry_id, text) VALUES (?, ?)"
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
};

export const getAllEntriesWithNotes = async () => {
    const db = await SQLite.openDatabaseAsync("steady.db");

    const results = await db.getAllAsync<{
        id: number;
        score: number;
        created_at: string;
        text: string | null;
    }>(
        `SELECT e.id, e.score, e.created_at, n.text
        FROM mood_entries e
        LEFT JOIN notes n ON e.id = n.entry_id
        ORDER BY e.created_at DESC;`
    );

    return results;
};
