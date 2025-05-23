import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

interface MoodEntry {
    id: number;
    score: number;
    created_at: string;
    note: string | null;
}

class WebStorage {
    private dbName = "steady_web";
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = event => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains("mood_entries")) {
                    const moodStore = db.createObjectStore("mood_entries", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    moodStore.createIndex("created_at", "created_at");
                }
                if (!db.objectStoreNames.contains("notes")) {
                    const notesStore = db.createObjectStore("notes", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    notesStore.createIndex("entry_id", "entry_id");
                }
            };
        });
    }

    async getAllEntriesWithNotes(): Promise<MoodEntry[]> {
        const db = this.db;
        if (!db) throw new Error("Database not initialized");
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ["mood_entries", "notes"],
                "readonly"
            );
            const moodStore = transaction.objectStore("mood_entries");
            const notesStore = transaction.objectStore("notes");
            const entries: MoodEntry[] = [];

            moodStore.openCursor().onsuccess = event => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const entry = cursor.value;
                    const noteRequest = notesStore
                        .index("entry_id")
                        .get(entry.id);
                    noteRequest.onsuccess = () => {
                        entries.push({
                            ...entry,
                            note: noteRequest.result?.note || null,
                        });
                    };
                    cursor.continue();
                } else {
                    resolve(entries);
                }
            };
        });
    }

    async addMoodEntryWithNotes(score: number, notes: string[]): Promise<void> {
        const db = this.db;
        if (!db) throw new Error("Database not initialized");
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ["mood_entries", "notes"],
                "readwrite"
            );
            const moodStore = transaction.objectStore("mood_entries");
            const notesStore = transaction.objectStore("notes");

            const entry = {
                score,
                created_at: new Date().toISOString(),
            };

            const moodRequest = moodStore.add(entry);
            moodRequest.onsuccess = () => {
                const entryId = moodRequest.result;
                notes.forEach(note => {
                    notesStore.add({ entry_id: entryId, note });
                });
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getEntryById(id: number): Promise<MoodEntry[]> {
        const db = this.db;
        if (!db) throw new Error("Database not initialized");
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ["mood_entries", "notes"],
                "readonly"
            );
            const moodStore = transaction.objectStore("mood_entries");
            const notesStore = transaction.objectStore("notes");

            const request = moodStore.get(id);
            request.onsuccess = () => {
                if (!request.result) {
                    resolve([]);
                    return;
                }

                const entry = request.result;
                const noteRequest = notesStore.index("entry_id").get(id);
                noteRequest.onsuccess = () => {
                    resolve([
                        {
                            ...entry,
                            note: noteRequest.result?.note || null,
                        },
                    ]);
                };
            };
            request.onerror = () => reject(request.error);
        });
    }

    async resetTables(): Promise<void> {
        const db = this.db;
        if (!db) throw new Error("Database not initialized");
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                ["mood_entries", "notes"],
                "readwrite"
            );
            const moodStore = transaction.objectStore("mood_entries");
            const notesStore = transaction.objectStore("notes");

            notesStore.clear();
            moodStore.clear();

            transaction.oncomplete = () => {
                console.log("Tables cleared");
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });
    }
}

export class SteadyDB {
    private nativeDB: SQLite.WebSQLDatabase | null = null;
    private webDB: WebStorage | null = null;
    private dbName = "steady.db";

    constructor() {
        if (Platform.OS === "web") {
            this.webDB = new WebStorage();
        } else {
            this.nativeDB = SQLite.openDatabase(this.dbName);
        }
    }

    async initDB(): Promise<void> {
        if (Platform.OS === "web") {
            if (!this.webDB) throw new Error("Web database not initialized");
            return this.webDB.init();
        }

        if (!this.nativeDB) throw new Error("Native database not initialized");
        return new Promise((resolve, reject) => {
            this.nativeDB!.transaction(
                tx => {
                    tx.executeSql("PRAGMA journal_mode = WAL;");
                    tx.executeSql(
                        `CREATE TABLE IF NOT EXISTS mood_entries (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            score INTEGER,
                            created_at TEXT DEFAULT CURRENT_TIMESTAMP
                        );`
                    );
                    tx.executeSql(
                        `CREATE TABLE IF NOT EXISTS notes (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            entry_id INTEGER,
                            note TEXT,
                            FOREIGN KEY (entry_id) REFERENCES mood_entries(id)
                        );`
                    );
                },
                error => reject(error),
                () => resolve()
            );
        });
    }

    async getAllEntriesWithNotes(): Promise<MoodEntry[]> {
        if (Platform.OS === "web") {
            if (!this.webDB) throw new Error("Web database not initialized");
            return this.webDB.getAllEntriesWithNotes();
        }

        if (!this.nativeDB) throw new Error("Native database not initialized");
        return new Promise((resolve, reject) => {
            this.nativeDB!.transaction(tx => {
                tx.executeSql(
                    `SELECT e.id, e.score, e.created_at, n.note
                    FROM mood_entries e
                    LEFT JOIN notes n ON e.id = n.entry_id
                    ORDER BY e.created_at DESC;`,
                    [],
                    (_, { rows: { _array } }) => resolve(_array),
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    async addMoodEntryWithNotes(score: number, notes: string[]): Promise<void> {
        if (Platform.OS === "web") {
            if (!this.webDB) throw new Error("Web database not initialized");
            return this.webDB.addMoodEntryWithNotes(score, notes);
        }

        if (!this.nativeDB) throw new Error("Native database not initialized");
        return new Promise((resolve, reject) => {
            this.nativeDB!.transaction(
                tx => {
                    tx.executeSql(
                        "INSERT INTO mood_entries (score) VALUES (?)",
                        [score],
                        (_, { insertId }) => {
                            if (insertId != null) {
                                notes.forEach(note => {
                                    tx.executeSql(
                                        "INSERT INTO notes (entry_id, note) VALUES (?, ?)",
                                        [insertId, note]
                                    );
                                });
                            }
                        }
                    );
                },
                error => reject(error),
                () => resolve()
            );
        });
    }

    async getEntryById(id: number): Promise<MoodEntry[]> {
        if (Platform.OS === "web") {
            if (!this.webDB) throw new Error("Web database not initialized");
            return this.webDB.getEntryById(id);
        }

        if (!this.nativeDB) throw new Error("Native database not initialized");
        return new Promise((resolve, reject) => {
            this.nativeDB!.transaction(tx => {
                tx.executeSql(
                    `SELECT e.id, e.score, e.created_at, n.note
                    FROM mood_entries e
                    LEFT JOIN notes n ON e.id = n.entry_id
                    WHERE e.id = ?
                    ORDER BY e.created_at DESC;`,
                    [id],
                    (_, { rows: { _array } }) => resolve(_array),
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    async resetTables(): Promise<void> {
        if (Platform.OS === "web") {
            if (!this.webDB) throw new Error("Web database not initialized");
            return this.webDB.resetTables();
        }

        if (!this.nativeDB) throw new Error("Native database not initialized");
        return new Promise((resolve, reject) => {
            this.nativeDB!.transaction(
                tx => {
                    tx.executeSql("DROP TABLE IF EXISTS notes;");
                    tx.executeSql("DROP TABLE IF EXISTS mood_entries;");
                },
                error => reject(error),
                () => {
                    console.log("Tables dropped.");
                    resolve();
                }
            );
        });
    }
}
