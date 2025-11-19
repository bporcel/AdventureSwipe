import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVE_STORAGE_KEY = "@swipequest_save";

export async function loadSave() {
  try {
    const save = await AsyncStorage.getItem(SAVE_STORAGE_KEY);
    return save ? JSON.parse(save) : null;
  } catch (e) {
    console.warn("loadSave error", e);
    return null;
  }
}

export async function saveGame(data) {
  try {
    await AsyncStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("saveGame error", e);
  }
}

export async function clearSave() {
  try {
    await AsyncStorage.removeItem(SAVE_STORAGE_KEY);
  } catch (e) {
    console.warn("clearSave error", e);
  }
}