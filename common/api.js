const API_URL = 'https://adventureswipe.onrender.com'
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || API_URL
import * as FileSystem from 'expo-file-system/legacy';
import { saveImage } from './imageStorage';

function stripImages(node) {
  const { image, ...rest } = node;
  return rest;
}

export async function generateNextNode({ currentNode, choice, history, depth }) {
  let imageToSend = currentNode.image;

  if (imageToSend && imageToSend.startsWith('file://')) {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageToSend, {
        encoding: FileSystem.EncodingType.Base64,
      });
      imageToSend = `data:image/png;base64,${base64}`;
    } catch (e) {
      console.warn("Failed to read image file for upload:", e);
      // Fallback: send as is (will likely fail on backend but better than crashing here)
    }
  }

  const payload = {
    currentNode: { ...currentNode, image: imageToSend },
    choice,
    history: history.map(n => stripImages(n)),
    depth
  };

  const res = await fetch(`${API_HOST}/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Network error");

  const data = await res.json();
  if (data.image) {
    data.image = await saveImage(data.image);
  }

  return data;
}

export async function generateNewGameNode() {
  const res = await fetch(`${API_HOST}/new-game`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Network error");

  const data = await res.json();
  if (data.image) {
    data.image = await saveImage(data.image);
  }

  return data;
}
