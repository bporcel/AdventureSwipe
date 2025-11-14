import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@swipequest_save";

export async function loadSave() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    console.warn("loadSave error", e);
    return null;
  }
}

export async function saveGame(data) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("saveGame error", e);
  }
}

export async function clearSave() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("clearSave error", e);
  }
}