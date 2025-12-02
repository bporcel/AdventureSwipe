import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

const IMAGE_DIR = FileSystem.documentDirectory + 'images/';

async function ensureDirExists() {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
    }
}

export async function saveImage(base64Data) {
    try {
        await ensureDirExists();

        // If it's already a file URI or http URL, return it as is
        if (base64Data.startsWith('file://') || base64Data.startsWith('http')) {
            return base64Data;
        }

        // Strip header if present (e.g., "data:image/png;base64,")
        const base64Code = base64Data.split('base64,').pop();

        // Generate unique filename
        const filename = Crypto.randomUUID() + '.png';
        const filepath = IMAGE_DIR + filename;

        await FileSystem.writeAsStringAsync(filepath, base64Code, {
            encoding: FileSystem.EncodingType.Base64,
        });

        return filepath;
    } catch (e) {
        console.warn("Error saving image to disk:", e);
        // Fallback: return original data if save fails, though this might still crash AsyncStorage
        return base64Data;
    }
}

export async function deleteImage(uri) {
    if (!uri || !uri.startsWith('file://')) return;

    try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
        console.warn("Error deleting image:", e);
    }
}

export async function clearAllImages() {
    try {
        console.log("[Storage] Clearing all images...");
        await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
        await ensureDirExists();
    } catch (e) {
        console.warn("Error clearing images:", e);
    }
}
