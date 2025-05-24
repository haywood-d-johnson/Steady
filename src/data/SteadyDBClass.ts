import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

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
        console.log("Initializing WebStorage...");
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error("WebStorage init error:", request.error);
                reject(request.error);
            };
            request.onsuccess = () => {
                console.log("WebStorage initialized successfully");
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = event => {
                console.log("WebStorage upgrade needed, creating stores...");
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains("mood_entries")) {
                    const moodStore = db.createObjectStore("mood_entries", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    moodStore.createIndex("created_at", "created_at");
                    console.log("Created mood_entries store");
                }
                if (!db.objectStoreNames.contains("notes")) {
                    const notesStore = db.createObjectStore("notes", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    notesStore.createIndex("entry_id", "entry_id");
                    console.log("Created notes store");
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

    async addMoodEntryWithNotes(
        score: number,
        notes: string[],
        created_at?: Date
    ): Promise<void> {
        console.log("Adding mood entry:", { score, notes, created_at });
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
                created_at:
                    created_at?.toISOString() || new Date().toISOString(),
            };

            const moodRequest = moodStore.add(entry);
            moodRequest.onsuccess = () => {
                const entryId = moodRequest.result;
                console.log("Added mood entry with ID:", entryId);
                notes.forEach(note => {
                    notesStore.add({ entry_id: entryId, note });
                    console.log("Added note for entry:", entryId);
                });
            };

            transaction.oncomplete = () => {
                console.log("Transaction completed successfully");
                resolve();
            };
            transaction.onerror = () => {
                console.error("Transaction error:", transaction.error);
                reject(transaction.error);
            };
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
        console.log("WebStorage: Starting resetTables...");
        const db = this.db;
        if (!db) {
            console.error(
                "WebStorage: Database not initialized in resetTables"
            );
            throw new Error("Database not initialized");
        }
        return new Promise((resolve, reject) => {
            try {
                console.log("WebStorage: Creating transaction for reset...");
                const transaction = db.transaction(
                    ["mood_entries", "notes"],
                    "readwrite"
                );
                const moodStore = transaction.objectStore("mood_entries");
                const notesStore = transaction.objectStore("notes");

                console.log("WebStorage: Clearing notes store...");
                const clearNotesRequest = notesStore.clear();
                clearNotesRequest.onsuccess = () => {
                    console.log("WebStorage: Notes store cleared");
                };
                clearNotesRequest.onerror = () => {
                    console.error(
                        "WebStorage: Error clearing notes store:",
                        clearNotesRequest.error
                    );
                };

                console.log("WebStorage: Clearing mood_entries store...");
                const clearMoodRequest = moodStore.clear();
                clearMoodRequest.onsuccess = () => {
                    console.log("WebStorage: Mood entries store cleared");
                };
                clearMoodRequest.onerror = () => {
                    console.error(
                        "WebStorage: Error clearing mood entries store:",
                        clearMoodRequest.error
                    );
                };

                transaction.oncomplete = () => {
                    console.log(
                        "WebStorage: Reset transaction completed successfully"
                    );
                    resolve();
                };
                transaction.onerror = () => {
                    console.error(
                        "WebStorage: Reset transaction error:",
                        transaction.error
                    );
                    reject(transaction.error);
                };
            } catch (error) {
                console.error("WebStorage: Error in resetTables:", error);
                reject(error);
            }
        });
    }
}

export interface ExportedData {
    version: string;
    timestamp: string;
    entries: {
        score: number;
        created_at: string;
        notes: string[];
    }[];
}

export class SteadyDB {
    private nativeDB: SQLite.WebSQLDatabase | null = null;
    private webDB: WebStorage | null = null;
    private dbName = "steady.db";

    constructor() {
        console.log("Initializing SteadyDB...");
        console.log("Platform:", Platform.OS);
        console.log("Running in Expo:", "__DEV__" in global);
        console.log("Window object available:", typeof window !== "undefined");
        console.log(
            "IndexedDB available:",
            typeof window !== "undefined" && "indexedDB" in window
        );

        // Use WebStorage only if we're in a real web browser
        if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.indexedDB
        ) {
            console.log("Using WebStorage for database operations");
            this.webDB = new WebStorage();
        } else {
            console.log("Using SQLite for database operations");
            try {
                this.nativeDB = SQLite.openDatabase(this.dbName);
                console.log("SQLite database opened successfully");
            } catch (error) {
                console.error("Error opening SQLite database:", error);
                throw error;
            }
        }
    }

    async initDB(): Promise<void> {
        // Use WebStorage only if we're in a real web browser
        if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.indexedDB
        ) {
            if (!this.webDB) throw new Error("Web database not initialized");
            return this.webDB.init();
        }

        if (!this.nativeDB) throw new Error("Native database not initialized");

        // Check if we have permission to write to the filesystem
        const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
        console.log("Database directory:", dbDirectory);

        const dirInfo = await FileSystem.getInfoAsync(dbDirectory);
        if (!dirInfo.exists) {
            console.log("Creating SQLite directory...");
            await FileSystem.makeDirectoryAsync(dbDirectory, {
                intermediates: true,
            });
        }

        return new Promise((resolve, reject) => {
            console.log("Initializing database tables...");
            this.nativeDB!.transaction(
                tx => {
                    console.log("Beginning transaction...");
                    tx.executeSql(
                        "PRAGMA journal_mode = WAL;",
                        [],
                        () => console.log("Set journal mode"),
                        (_, error) => {
                            console.error("Error setting journal mode:", error);
                            return false;
                        }
                    );

                    tx.executeSql(
                        `CREATE TABLE IF NOT EXISTS mood_entries (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            score INTEGER,
                            created_at TEXT DEFAULT CURRENT_TIMESTAMP
                        );`,
                        [],
                        () => console.log("Created mood_entries table"),
                        (_, error) => {
                            console.error(
                                "Error creating mood_entries table:",
                                error
                            );
                            return false;
                        }
                    );

                    tx.executeSql(
                        `CREATE TABLE IF NOT EXISTS notes (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            entry_id INTEGER,
                            note TEXT,
                            FOREIGN KEY (entry_id) REFERENCES mood_entries(id)
                        );`,
                        [],
                        () => console.log("Created notes table"),
                        (_, error) => {
                            console.error("Error creating notes table:", error);
                            return false;
                        }
                    );
                },
                error => {
                    console.error("Transaction error:", error);
                    reject(error);
                },
                () => {
                    console.log(
                        "Database initialization completed successfully"
                    );
                    resolve();
                }
            );
        });
    }

    async getAllEntriesWithNotes(): Promise<MoodEntry[]> {
        // Use WebStorage only if we're in a real web browser
        if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.indexedDB
        ) {
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
                    (_, { rows: { _array } }) => {
                        console.log("Retrieved entries:", _array);
                        resolve(_array);
                    },
                    (_, error) => {
                        console.error("Error getting entries:", error);
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    async addMoodEntryWithNotes(
        score: number,
        notes: string[],
        created_at?: Date
    ): Promise<void> {
        // Use WebStorage only if we're in a real web browser
        if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.indexedDB
        ) {
            if (!this.webDB) throw new Error("Web database not initialized");
            return this.webDB.addMoodEntryWithNotes(score, notes, created_at);
        }

        if (!this.nativeDB) throw new Error("Native database not initialized");
        return new Promise((resolve, reject) => {
            this.nativeDB!.transaction(
                tx => {
                    tx.executeSql(
                        "INSERT INTO mood_entries (score, created_at) VALUES (?, ?)",
                        [
                            score,
                            created_at?.toISOString() ||
                                new Date().toISOString(),
                        ],
                        (_, { insertId }) => {
                            console.log(
                                "Inserted mood entry with ID:",
                                insertId
                            );
                            if (insertId != null) {
                                notes.forEach(note => {
                                    if (note.trim()) {
                                        // Only insert non-empty notes
                                        tx.executeSql(
                                            "INSERT INTO notes (entry_id, note) VALUES (?, ?)",
                                            [insertId, note],
                                            () =>
                                                console.log(
                                                    "Inserted note for entry:",
                                                    insertId
                                                ),
                                            (_, error) => {
                                                console.error(
                                                    "Error inserting note:",
                                                    error
                                                );
                                                return false;
                                            }
                                        );
                                    }
                                });
                            }
                        },
                        (_, error) => {
                            console.error("Error inserting mood entry:", error);
                            return false;
                        }
                    );
                },
                error => {
                    console.error("Transaction error:", error);
                    reject(error);
                },
                () => {
                    console.log("Successfully added mood entry with notes");
                    resolve();
                }
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
        console.log("SteadyDB: Starting resetTables...");
        if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.indexedDB
        ) {
            console.log("SteadyDB: Using WebStorage for reset");
            if (!this.webDB) {
                console.error("SteadyDB: WebDB not initialized");
                throw new Error("Web database not initialized");
            }
            return this.webDB.resetTables();
        }

        console.log("SteadyDB: Using SQLite for reset");
        if (!this.nativeDB) {
            console.error("SteadyDB: NativeDB not initialized");
            throw new Error("Native database not initialized");
        }
        return new Promise((resolve, reject) => {
            console.log("Starting table reset...");
            this.nativeDB!.transaction(
                tx => {
                    // Drop tables in correct order (notes depends on mood_entries)
                    console.log("Dropping notes table...");
                    tx.executeSql(
                        "DROP TABLE IF EXISTS notes;",
                        [],
                        () => console.log("Notes table dropped"),
                        (_, error) => {
                            console.error("Error dropping notes table:", error);
                            return false;
                        }
                    );

                    console.log("Dropping mood_entries table...");
                    tx.executeSql(
                        "DROP TABLE IF EXISTS mood_entries;",
                        [],
                        () => console.log("Mood entries table dropped"),
                        (_, error) => {
                            console.error(
                                "Error dropping mood_entries table:",
                                error
                            );
                            return false;
                        }
                    );
                },
                error => {
                    console.error("Transaction error during reset:", error);
                    reject(error);
                },
                () => {
                    console.log("All tables dropped successfully");
                    resolve();
                }
            );
        });
    }

    async exportData(): Promise<ExportedData> {
        const entries = await this.getAllEntriesWithNotes();
        console.log("entries", entries);
        console.log("Button Pressed!");

        // Group notes by entry_id
        const entriesWithNotes = entries.reduce((acc, entry) => {
            const existingEntry = acc.find(e => e.id === entry.id);
            if (existingEntry) {
                if (entry.note) {
                    existingEntry.notes.push(entry.note);
                }
            } else {
                acc.push({
                    id: entry.id,
                    score: entry.score,
                    created_at: entry.created_at,
                    notes: entry.note ? [entry.note] : [],
                });
            }
            return acc;
        }, [] as Array<{ id: number; score: number; created_at: string; notes: string[] }>);

        // Format for export
        const exportData: ExportedData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            entries: entriesWithNotes.map(({ score, created_at, notes }) => ({
                score,
                created_at,
                notes,
            })),
        };

        return exportData;
    }

    async importData(data: ExportedData): Promise<void> {
        console.log("Starting importData with:", data);

        if (!data.version || !data.entries || !Array.isArray(data.entries)) {
            console.error("Invalid import data format:", data);
            throw new Error("Invalid import data format");
        }

        try {
            // Reset the database first
            console.log("Resetting tables...");
            await this.resetTables();
            console.log("Tables reset successfully");

            console.log("Initializing database...");
            await this.initDB();
            console.log("Database initialized");

            // Import all entries
            console.log("Starting to import entries...");
            for (const entry of data.entries) {
                console.log("Importing entry:", entry);
                await this.addMoodEntryWithNotes(
                    entry.score,
                    entry.notes,
                    new Date(entry.created_at)
                );
            }
            console.log("All entries imported successfully");
        } catch (error) {
            console.error("Error during import:", error);
            throw error;
        }
    }
}
