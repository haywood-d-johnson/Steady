import * as SQLite from "expo-sqlite";

export const seedDB = async () => {
    const db = await SQLite.openDatabaseAsync("steady.db");

    const entryStmt = await db.prepareAsync(
        "INSERT INTO mood_entries (score, created_at) VALUES (?, ?) RETURNING id"
    );
    const noteStmt = await db.prepareAsync(
        "INSERT INTO notes (entry_id, note) VALUES (?, ?)"
    );

    const moods = [
        {
            score: 2,
            date: "2025-05-03 21:00:00",
            notes: ["Definitely noticed the low."],
        },
        {
            score: 3,
            date: "2025-05-04 21:00:00",
            notes: [""],
        },
        {
            score: 2,
            date: "2025-05-05 21:00:00",
            notes: [""],
        },
        {
            score: 2,
            date: "2025-05-06 21:00:00",
            notes: [""],
        },
        {
            score: 2,
            date: "2025-05-07 21:00:00",
            notes: [""],
        },
        {
            score: 3,
            date: "2025-05-08 21:00:00",
            notes: [
                "A little better than yesterday, but still noticibly low",
                "Got going strong with this app. A lot of small victories here!",
            ],
        },
    ];

    try {
        for (const mood of moods) {
            const res = await entryStmt.executeAsync<{ id: number }>(
                mood.score,
                mood.date
            );
            const entryId = res.lastInsertRowId;
            for (const note of mood.notes) {
                await noteStmt.executeAsync(entryId, note);
            }
        }
        console.log("Seed data inserted.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await entryStmt.finalizeAsync();
        await noteStmt.finalizeAsync();
    }
};
