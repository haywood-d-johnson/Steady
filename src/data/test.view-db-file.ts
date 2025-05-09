import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export const exportDB = async () => {
  const dbFileUri = `${FileSystem.documentDirectory}SQLite/steady.db`;
  const exportUri = `${FileSystem.documentDirectory}steady-export.db`;

  const exists = await FileSystem.getInfoAsync(dbFileUri);
  if (exists.exists) {
    await FileSystem.copyAsync({
      from: dbFileUri,
      to: exportUri,
    });
    console.log("Exported DB to:", exportUri);
  } else {
    console.warn("DB file not found.");
  }
};
